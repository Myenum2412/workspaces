// @ts-nocheck
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import hpp from "hpp";
import { env, getCorsOrigins, getIpWhitelist } from "../config/env.js";
import { logger } from "../core/logging/logger.js";

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
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
  })(_req, res, next);
}

// ── HPP (HTTP Parameter Pollution) ───────────────────────────

export const preventParameterPollution = hpp();

// ── IP Whitelist ──────────────────────────────────────────────

export function ipWhitelist(req: Request, res: Response, next: NextFunction): void {
  const whitelist = getIpWhitelist();
  if (whitelist.length === 0) return next();

  const clientIp = req.ip ?? req.socket.remoteAddress ?? "";
  if (!whitelist.includes(clientIp)) {
    logger.warn({ ip: clientIp, path: req.path }, "IP whitelist blocked");
    res.status(403).json({ success: false, error: { code: "IP_BLOCKED", message: "Access denied from this IP" }, meta: { timestamp: new Date().toISOString() } });
    return;
  }
  next();
}

// ── CSRF Protection ───────────────────────────────────────────

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export function setCsrfCookie(req: Request, res: Response): void {
  const token = crypto.randomUUID();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
  (req as unknown as Record<string, unknown>)._csrfToken = token;
}

export function validateCsrf(req: Request, res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ success: false, error: { code: "CSRF_VIOLATION", message: "CSRF token missing or invalid" }, meta: { timestamp: new Date().toISOString() } });
    return;
  }
  next();
}

// ── Input Sanitization ────────────────────────────────────────

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") sanitizeObject(req.body);
  next();
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      obj[key] = val
        .replace(/^\$/, "")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      sanitizeObject(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "object" && item !== null) sanitizeObject(item as Record<string, unknown>);
      }
    }
  }
}

// ── Audit Logger ──────────────────────────────────────────────

export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now();
  const originalEnd = _res.end.bind(_res);
  _res.end = function (chunk?: unknown, encoding?: unknown, cb?: unknown) {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: _res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: (req as unknown as Record<string, unknown>)?.user?.id,
    }, "Request completed");
    return originalEnd(chunk as never, encoding as never, cb as never);
  };
  next();
}
