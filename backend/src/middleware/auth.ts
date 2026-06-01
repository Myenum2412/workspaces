import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getRedis, isRedisConnected } from "../redis/connection.js";
import { AuthenticationError, AuthorizationError } from "../core/errors/AppError.js";

// ── Types ──────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ── Token Configuration ───────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = env.JWT_REFRESH_EXPIRY || "30d";
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 min in ms
const REFRESH_TOKEN_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

// ── Cookie helpers ─────────────────────────────────────────────

export function setAuthCookies(res: Response, tokens: TokenPair): void {
  const isSecure = env.COOKIE_SECURE || env.NODE_ENV === "production";
  const sameSite = isSecure ? "strict" as const : "lax" as const;

  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    path: "/",
    ...(env.COOKIE_SECRET && { signed: true }),
  });

  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    path: "/api/auth",
    ...(env.COOKIE_SECRET && { signed: true }),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth" });
}

/** Extract access token from cookie or Authorization header */
function extractAccessToken(req: Request): string | null {
  // 1. Prefer httpOnly cookie
  const cookieToken = req.cookies?.access_token;
  if (cookieToken) return cookieToken;

  // 2. Fallback: Authorization header (for API clients / Socket.IO)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
}

/** Extract refresh token from cookie or request body */
function extractRefreshToken(req: Request): string | null {
  // 1. Prefer httpOnly cookie
  const cookieToken = req.cookies?.refresh_token;
  if (cookieToken) return cookieToken;

  // 2. Fallback: request body
  if (req.body?.refreshToken && typeof req.body.refreshToken === "string") {
    return req.body.refreshToken;
  }

  return null;
}

// ── Token Functions ───────────────────────────────────────────

/** Sign a short-lived access token */
export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  });
}

/** Sign a long-lived refresh token, store metadata in Redis */
export function signRefreshToken(payload: AuthPayload, req?: Request): string {
  const tokenId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_COOKIE_MAX_AGE);

  const record = {
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role,
    deviceInfo: req?.headers["user-agent"] || null,
    ipAddress: req?.ip || null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revoked: false,
  };

  // Store in Redis if available, otherwise ephemeral in-memory (dev only)
  if (isRedisConnected()) {
    const r = getRedis()!;
    r.setex(`refresh:${tokenId}`, REFRESH_TOKEN_EXPIRY_SECONDS, JSON.stringify(record)).catch((err: Error) => {
      console.error("[Auth] Redis setex failed for refresh token:", err.message);
    });
  } else {
    console.warn("[Auth] Redis unavailable — refresh tokens stored in-memory (dev only)");
    fallbackTokenStore.set(tokenId, record);
  }

  return jwt.sign({ ...payload, tokenId }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    jwtid: tokenId,
  });
}

/** Fallback in-memory store — only used when Redis is down */
const fallbackTokenStore = new Map<string, Record<string, unknown>>();

/** Verify and decode a refresh token */
export async function verifyRefreshToken(token: string): Promise<{ payload: AuthPayload; tokenId: string }> {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload & { tokenId: string };

  let record: Record<string, unknown> | null = null;

  if (isRedisConnected()) {
    const r = getRedis()!;
    const raw = await r.get(`refresh:${decoded.tokenId}`);
    if (raw) {
      record = JSON.parse(raw);
    }
  } else {
    record = fallbackTokenStore.get(decoded.tokenId) || null;
  }

  if (!record) {
    throw new AuthenticationError("Refresh token not found or expired");
  }
  if (record.revoked === true) {
    throw new AuthenticationError("Refresh token has been revoked. Please login again.");
  }

  return {
    payload: {
      userId: record.userId as string,
      email: record.email as string,
      organizationId: record.organizationId as string,
      role: record.role as string,
    },
    tokenId: decoded.tokenId,
  };
}

/** Revoke a specific refresh token */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  if (isRedisConnected()) {
    const r = getRedis()!;
    await r.del(`refresh:${tokenId}`);
  } else {
    fallbackTokenStore.delete(tokenId);
  }
}

/** Revoke all refresh tokens for a user */
export async function revokeAllUserTokens(userId: string): Promise<number> {
  // Redis approach: scan for user's tokens
  let count = 0;

  if (isRedisConnected()) {
    const r = getRedis()!;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await r.scan(cursor, "MATCH", "refresh:*", "COUNT", 100);
      cursor = nextCursor;
      for (const key of keys) {
        const raw = await r.get(key);
        if (raw) {
          const record = JSON.parse(raw);
          if (record.userId === userId) {
            await r.del(key);
            count++;
          }
        }
      }
    } while (cursor !== "0");
  } else {
    for (const [tokenId, record] of fallbackTokenStore) {
      if ((record as any).userId === userId) {
        fallbackTokenStore.delete(tokenId);
        count++;
      }
    }
  }
  return count;
}

/** Get active sessions for a user */
export async function getUserSessions(userId: string): Promise<Array<{ tokenId: string; deviceInfo?: string; ipAddress?: string; createdAt: string }>> {
  const sessions: Array<{ tokenId: string; deviceInfo?: string; ipAddress?: string; createdAt: string }> = [];

  if (isRedisConnected()) {
    const r = getRedis()!;
    let cursor = "0";
    do {
      const [nextCursor, keys] = await r.scan(cursor, "MATCH", "refresh:*", "COUNT", 100);
      cursor = nextCursor;
      for (const key of keys) {
        const raw = await r.get(key);
        if (raw) {
          const record = JSON.parse(raw);
          if (record.userId === userId && !record.revoked) {
            const tokenId = key.replace("refresh:", "");
            sessions.push({
              tokenId,
              deviceInfo: record.deviceInfo || undefined,
              ipAddress: record.ipAddress || undefined,
              createdAt: record.createdAt,
            });
          }
        }
      }
    } while (cursor !== "0");
  } else {
    for (const [tokenId, record] of fallbackTokenStore) {
      if ((record as any).userId === userId && !(record as any).revoked) {
        sessions.push({
          tokenId,
          deviceInfo: (record as any).deviceInfo || undefined,
          ipAddress: (record as any).ipAddress || undefined,
          createdAt: (record as any).createdAt,
        });
      }
    }
  }
  return sessions;
}

/** Generate both access + refresh tokens */
export function signTokenPair(payload: AuthPayload, req?: Request): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, req),
  };
}

// ── Middleware ──────────────────────────────────────────────────

/** Verify access token from cookie or header and attach user to request */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);

  if (!token) {
    return next(new AuthenticationError("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("Access token expired. Please refresh your session."));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError("Invalid token"));
    }
    return next(new AuthenticationError("Authentication failed"));
  }
}

/** Optional auth — doesn't fail if no token, just doesn't set user */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    (req as AuthRequest).user = decoded;
  } catch {
    // Ignore errors — user just won't be set
  }
  next();
}

/** Require specific roles (hierarchical) */
export function requireRole(...allowedRoles: string[]): (req: Request, _res: Response, next: NextFunction) => void {
  const ROLE_HIERARCHY: Record<string, number> = {
    viewer: 0,
    member: 1,
    operator: 2,
    admin: 3,
    owner: 4,
  };

  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AuthenticationError());
    }

    const userLevel = ROLE_HIERARCHY[authReq.user.role] ?? -1;
    const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 999));

    if (userLevel < minLevel) {
      return next(new AuthorizationError(
        `Required role: ${allowedRoles.join(" or ")}. Your role: ${authReq.user.role}`
      ));
    }

    next();
  };
}
