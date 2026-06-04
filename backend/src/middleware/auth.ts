import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getRedis, isRedisConnected } from "../db/redis.js";
import { AuthenticationError } from "../core/errors/AppError.js";
import { logger } from "../core/logging/logger.js";

// ── Types ──────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
  organizationId: string;
  workspaceId: string | null;
  role: string;
  tokenId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Token Config ──────────────────────────────────────────────

const ACCESS_EXPIRY = env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = env.JWT_REFRESH_EXPIRY || "30d";
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
const ACCESS_COOKIE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MS = REFRESH_EXPIRY_MS;

// ── Cookie Helpers ────────────────────────────────────────────

export function setAuthCookies(res: Response, tokens: TokenPair): void {
  const secure = env.COOKIE_SECURE || env.NODE_ENV === "production";
  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true, secure, sameSite: env.COOKIE_SAME_SITE, maxAge: ACCESS_COOKIE_MS, path: "/",
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true, secure, sameSite: env.COOKIE_SAME_SITE, maxAge: REFRESH_COOKIE_MS, path: "/api/v1/auth",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/v1/auth" });
}

// ── Token Extraction ──────────────────────────────────────────

function extractAccessToken(req: Request): string | null {
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  return null;
}

// ── Token Signing ─────────────────────────────────────────────

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY as jwt.SignOptions["expiresIn"] });
}

export async function signRefreshToken(payload: AuthPayload, req?: Request): Promise<string> {
  const tokenId = crypto.randomUUID();
  const record = {
    userId: payload.userId, email: payload.email,
    organizationId: payload.organizationId, workspaceId: payload.workspaceId,
    role: payload.role, deviceInfo: req?.headers["user-agent"] || null,
    ipAddress: req?.ip || null, createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString(), revoked: false,
  };
  if (isRedisConnected()) {
    await getRedis()!.setex(`refresh:${tokenId}`, Math.floor(REFRESH_EXPIRY_MS / 1000), JSON.stringify(record));
  } else {
    logger.warn("Redis unavailable — refresh tokens in-memory (dev only)");
    fallbackStore.set(tokenId, record);
  }
  return jwt.sign({ ...payload, tokenId }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY as jwt.SignOptions["expiresIn"] });
}

const fallbackStore = new Map<string, Record<string, unknown>>();

export async function verifyRefreshToken(token: string): Promise<{ payload: AuthPayload; tokenId: string }> {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload & { tokenId: string };
  let record: Record<string, unknown> | null = null;
  if (isRedisConnected()) {
    const raw = await getRedis()!.get(`refresh:${decoded.tokenId}`);
    if (raw) record = JSON.parse(raw);
  } else {
    record = fallbackStore.get(decoded.tokenId) || null;
  }
  if (!record) throw new AuthenticationError("Refresh token not found or expired");
  if (record.revoked === true) throw new AuthenticationError("Refresh token revoked");
  return { payload: { userId: record.userId as string, email: record.email as string, organizationId: record.organizationId as string, workspaceId: (record as Record<string, unknown>).workspaceId as string | null ?? null, role: record.role as string }, tokenId: decoded.tokenId };
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  if (isRedisConnected()) await getRedis()!.del(`refresh:${tokenId}`);
  else fallbackStore.delete(tokenId);
}

export async function revokeAllUserTokens(userId: string): Promise<number> {
  let count = 0;
  if (isRedisConnected()) {
    const r = getRedis()!;
    let cursor = "0";
    do {
      const [next, keys] = await r.scan(cursor, "MATCH", "refresh:*", "COUNT", 100);
      cursor = next;
      for (const key of keys) {
        const raw = await r.get(key);
        if (raw) { const rec = JSON.parse(raw); if (rec.userId === userId) { await r.del(key); count++; } }
      }
    } while (cursor !== "0");
  } else {
    for (const [tid, rec] of fallbackStore) { if ((rec as Record<string, unknown>).userId === userId) { fallbackStore.delete(tid); count++; } }
  }
  return count;
}

export function signTokenPair(payload: AuthPayload, _req?: Request): TokenPair {
  return { accessToken: signAccessToken(payload), refreshToken: "" };
}

// ── Middleware ──────────────────────────────────────────────────

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) return next(new AuthenticationError("No token provided"));
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(new AuthenticationError("Access token expired"));
    if (err instanceof jwt.JsonWebTokenError) return next(new AuthenticationError("Invalid token"));
    return next(new AuthenticationError("Authentication failed"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) return next();
  try {
    (req as AuthRequest).user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
  } catch { /* ignore */ }
  next();
}
