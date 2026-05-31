/**
 * Audit logging middleware + helper.
 * Auto-logs API actions to MongoDB audit_logs collection.
 */
import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/index.js";
import { AuthRequest } from "./auth.js";

const AUDIT_ACTIONS: Record<string, string> = {
  "POST /api/auth/login": "user_login",
  "POST /api/auth/register": "user_register",
  "POST /api/auth/logout": "user_logout",
  "POST /api/whatsapp/connect": "wa_connect",
  "POST /api/whatsapp/disconnect": "wa_disconnect",
  "POST /api/whatsapp/send": "message_sent",
  "POST /api/bulk": "bulk_job_created",
  "POST /api/campaigns/:id/execute": "campaign_started",
};

function getAction(method: string, path: string): string | null {
  const key = `${method} ${path}`;
  // Exact match first
  if (AUDIT_ACTIONS[key]) return AUDIT_ACTIONS[key];
  // Pattern match (ignore IDs)
  const normalized = path.replace(/\/[0-9a-f-]{36}/g, "/:id").replace(/\/\d+/g, "/:id");
  const patternKey = `${method} ${normalized}`;
  if (AUDIT_ACTIONS[patternKey]) return AUDIT_ACTIONS[patternKey];
  // Default: log mutating actions only
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return `api_${method.toLowerCase()}_${normalized.replace(/\//g, "_").replace(/:_id/g, "")}`;
  }
  return null;
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture response finish to log after response sent
  res.on("finish", () => {
    const action = getAction(req.method, req.path);
    if (!action) return;

    const authReq = req as AuthRequest;
    const duration = Date.now() - startTime;

    // Fire and forget — don't block response
    AuditLog.create({
      _id: crypto.randomUUID(),
      organizationId: authReq.user?.organizationId || "unknown",
      action,
      severity: res.statusCode >= 400 ? "warn" : "info",
      userId: authReq.user?.userId || null,
      userEmail: authReq.user?.email || null,
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      metadata: {
        durationMs: duration,
        query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
      },
    }).catch(() => {/* silent fail */});
  });

  next();
}

// ── Manual audit log helper ─────────────────────────────────
export async function logAudit(data: {
  organizationId: string;
  action: string;
  severity?: "info" | "warn" | "error";
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
}) {
  try {
    await AuditLog.create({
      _id: crypto.randomUUID(),
      ...data,
      severity: data.severity || "info",
      createdAt: new Date().toISOString(),
    });
  } catch {
    // silent fail
  }
}
