import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
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

// ── Refresh Token Store (in production, use Redis) ────────────

interface RefreshTokenRecord {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
}

const refreshTokenStore = new Map<string, RefreshTokenRecord>();

/** Clean up expired tokens every hour */
setInterval(() => {
  const now = new Date();
  for (const [token, record] of refreshTokenStore) {
    if (new Date(record.expiresAt) < now || record.revoked) {
      refreshTokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000);

// ── Token Functions ───────────────────────────────────────────

/** Sign a short-lived access token (15 minutes) */
export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    jwtid: crypto.randomUUID(),
  });
}

/** Sign a long-lived refresh token (30 days) */
export function signRefreshToken(payload: AuthPayload, req?: Request): string {
  const tokenId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  refreshTokenStore.set(tokenId, {
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role,
    deviceInfo: req?.headers["user-agent"] || undefined,
    ipAddress: req?.ip || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revoked: false,
  });

  return jwt.sign({ ...payload, tokenId }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    jwtid: tokenId,
  });
}

/** Generate both access + refresh tokens */
export function signTokenPair(payload: AuthPayload, req?: Request): TokenPair {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload, req),
  };
}

/** Verify and decode a refresh token */
export function verifyRefreshToken(token: string): { payload: AuthPayload; tokenId: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload & { tokenId: string };
  const record = refreshTokenStore.get(decoded.tokenId);

  if (!record) {
    throw new AuthenticationError("Refresh token not found or expired");
  }
  if (record.revoked) {
    throw new AuthenticationError("Refresh token has been revoked. Please login again.");
  }

  return {
    payload: {
      userId: record.userId,
      email: record.email,
      organizationId: record.organizationId,
      role: record.role,
    },
    tokenId: decoded.tokenId,
  };
}

/** Revoke a specific refresh token */
export function revokeRefreshToken(tokenId: string): void {
  const record = refreshTokenStore.get(tokenId);
  if (record) {
    record.revoked = true;
    refreshTokenStore.delete(tokenId);
  }
}

/** Revoke all refresh tokens for a user */
export function revokeAllUserTokens(userId: string): number {
  let count = 0;
  for (const [tokenId, record] of refreshTokenStore) {
    if (record.userId === userId) {
      refreshTokenStore.delete(tokenId);
      count++;
    }
  }
  return count;
}

/** Get active sessions for a user */
export function getUserSessions(userId: string): Array<{ tokenId: string; deviceInfo?: string; ipAddress?: string; createdAt: string }> {
  const sessions: Array<{ tokenId: string; deviceInfo?: string; ipAddress?: string; createdAt: string }> = [];
  for (const [tokenId, record] of refreshTokenStore) {
    if (record.userId === userId && !record.revoked) {
      sessions.push({
        tokenId,
        deviceInfo: record.deviceInfo,
        ipAddress: record.ipAddress,
        createdAt: record.createdAt,
      });
    }
  }
  return sessions;
}

// ── Middleware ──────────────────────────────────────────────────

/** Verify access token and attach user to request */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AuthenticationError("No token provided"));
  }

  try {
    const token = authHeader.split(" ")[1];
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
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    (req as AuthRequest).user = decoded;
  } catch {
    // Ignore errors — user just won't be set
  }
  next();
}

/** Require specific roles */
export function requireRole(...allowedRoles: string[]) {
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
