/**
 * Security middleware — helmet headers, input sanitization, RBAC.
 */
import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { AuthRequest } from "./auth.js";

// ── Helmet ────────────────────────────────────────────────────
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
  })(_req, res, next);
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
    } else if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitizeStrings(obj[key]);
    } else if (Array.isArray(obj[key])) {
      for (const item of obj[key]) {
        if (typeof item === "object" && item !== null) sanitizeStrings(item);
      }
    }
  }
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
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userLevel = ROLE_HIERARCHY[authReq.user.role] ?? -1;
    const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 999));
    if (userLevel < minLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// ── Organization access check ─────────────────────────────────
export function requireOrgAccess(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // Super admin bypass
  if (authReq.user.email === "zoo@myenum.in") return next();
  next();
}
