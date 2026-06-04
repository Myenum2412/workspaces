/**
 * RBAC Middleware — Role-Based Access Control.
 *
 * Role hierarchy (stored in orgmembers.role):
 *   ORG_ADMIN (4)        → Full organization access, all workspaces
 *   WORKSPACE_MANAGER (3) → Single workspace management
 *   MEMBER (1)            → Own data only within workspace
 *
 * Every query is filtered by organizationId.
 * Workspace-scoped queries are additionally filtered by workspaceId.
 * ORG_ADMIN can see all workspaces; others only their own.
 */
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";
import { AuthorizationError, AuthenticationError } from "../core/errors/AppError.js";

const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1,
  WORKSPACE_MANAGER: 3,
  ORG_ADMIN: 4,
};

// ── Role check middleware ──────────────────────────────────────
export function requireRole(...allowedRoles: string[]) {
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

// ── Workspace access middleware ────────────────────────────────
export function requireWorkspaceAccess(paramKey = "workspaceId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return next(new AuthenticationError());
    if (authReq.user.role === "ORG_ADMIN") return next();

    const targetId = req.params[paramKey] || req.body?.workspaceId || req.query?.workspaceId;
    if (targetId && targetId !== authReq.user.workspaceId) {
      return next(new AuthorizationError("You do not have access to this workspace"));
    }
    next();
  };
}

// ── Organization access middleware ─────────────────────────────
export function requireOrgAccess() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return next(new AuthenticationError());

    const targetId = req.params.orgId || req.body?.organizationId || req.query?.organizationId;
    if (targetId && targetId !== authReq.user.organizationId) {
      return next(new AuthorizationError("You do not have access to this organization"));
    }
    next();
  };
}

// ── Tenant isolation middleware ────────────────────────────────
export function enforceTenantIsolation(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user) return next(new AuthenticationError());
  (req as any).tenantContext = {
    organizationId: authReq.user.organizationId,
    workspaceId: authReq.user.workspaceId,
    userId: authReq.user.userId,
    role: authReq.user.role,
  };
  next();
}

// ── Helper: Build tenant-scoped filter ─────────────────────────
export function buildTenantFilter(
  authReq: AuthRequest,
  options: { includeWorkspace?: boolean } = {}
): Record<string, any> {
  const filter: Record<string, any> = {
    organizationId: authReq.user!.organizationId,
  };
  if (authReq.user!.role === "ORG_ADMIN" && !options.includeWorkspace) {
    return filter;
  }
  if (authReq.user!.workspaceId) {
    filter.workspaceId = authReq.user!.workspaceId;
  }
  return filter;
}

// ── Helper: Check if user can manage target user ───────────────
export function canManageUser(
  actorRole: string, actorWorkspaceId: string,
  targetRole: string, targetWorkspaceId: string
): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  if (actorLevel <= targetLevel) return false;
  if (actorRole === "ORG_ADMIN") return true;
  if (actorRole === "WORKSPACE_MANAGER") {
    return targetRole === "MEMBER" && actorWorkspaceId === targetWorkspaceId;
  }
  return false;
}
