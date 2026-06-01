/**
 * Security middleware — helmet headers, input sanitization, RBAC.
 */
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { AuthRequest } from "./auth.js";
import { isSuperAdmin } from "../config/env.js";
import { AuthorizationError } from "../core/errors/AppError.js";
import { env } from "../config/env.js";

// ── Helmet ────────────────────────────────────────────────────

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
  })(_req, res, next);
}

// ── CSRF Protection ───────────────────────────────────────────

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/** Set CSRF cookie (httpOnly=false so JS can read it for SPA) */
export function setCsrfCookie(req: Request, res: Response): void {
  const token = crypto.randomUUID();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,  // JS must read this to send back in header
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  });
  // Also set as req body for convenience
  (req as any)._csrfToken = token;
}

/** Validate CSRF token for state-changing requests */
export function validateCsrf(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      success: false,
      error: {
        code: "CSRF_VIOLATION",
        message: "CSRF token missing or invalid. Include X-CSRF-Token header.",
      },
    });
    return;
  }

  next();
}

// ── Input sanitization ────────────────────────────────────────

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeStrings(req.body);
  }
  next();
}

function sanitizeStrings(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      // Remove potential NoSQL injection operators
      if (obj[key].startsWith("$")) {
        obj[key] = obj[key].replace(/^\$/, "");
      }
      // Basic XSS prevention for string inputs
      obj[key] = obj[key]
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } else if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitizeStrings(obj[key]);
    } else if (Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        if (typeof item === "object" && item !== null) sanitizeStrings(item);
      }
    }
  }
}

// ── MongoDB sanitization (removes $ and . from keys) ─────────

export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Use express-mongo-sanitize for body, query, params
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req: sanitizedReq, key }: { req: Request; key: string }) => {
      console.warn(`[Sanitize] Removed prohibited key "${key}" from ${(sanitizedReq as any).originalUrl}`);
    },
  })(req, _res, next);
}

// ── RBAC ──────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  member: 1,
  operator: 2,
  admin: 3,
  owner: 4,
};

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return next(new AuthorizationError("Authentication required"));
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

// ── Organization access check ─────────────────────────────────

export function requireOrgAccess(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return next(new AuthorizationError("Authentication required"));
  }
  // Super admin bypass — uses env-based check
  if (isSuperAdmin(authReq.user.email)) return next();
  next();
}
