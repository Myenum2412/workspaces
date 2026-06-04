// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";
import { AuthenticationError, AuthorizationError } from "../core/errors/AppError.js";

const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1,
  WORKSPACE_MANAGER: 3,
  ORG_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return next(new AuthenticationError());
    if (authReq.user.role === "SUPER_ADMIN") return next();
    const userLevel = ROLE_HIERARCHY[authReq.user.role] ?? -1;
    const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] ?? 999));
    if (userLevel < minLevel) {
      return next(new AuthorizationError(`Required: ${allowedRoles.join(" or ")}. Yours: ${authReq.user.role}`));
    }
    next();
  };
}

export function requireWorkspaceAccess(paramKey = "workspaceId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return next(new AuthenticationError());
    if (authReq.user.role === "ORG_ADMIN" || authReq.user.role === "SUPER_ADMIN") return next();
    const targetId = req.params[paramKey] || req.body?.workspaceId || req.query?.workspaceId;
    if (targetId && targetId !== authReq.user.workspaceId) {
      return next(new AuthorizationError("No access to this workspace"));
    }
    next();
  };
}

export function enforceTenantIsolation(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  if (!authReq.user) return next(new AuthenticationError());
  (req as unknown as Record<string, unknown>).tenantContext = {
    organizationId: authReq.user.organizationId,
    workspaceId: authReq.user.workspaceId,
    userId: authReq.user.userId,
    role: authReq.user.role,
  };
  next();
}

export function buildTenantFilter(authReq: AuthRequest, includeWorkspace = false): Record<string, unknown> {
  const filter: Record<string, unknown> = { organizationId: authReq.user!.organizationId };
  if (authReq.user!.role === "ORG_ADMIN" && !includeWorkspace) return filter;
  if (authReq.user!.workspaceId) filter.workspaceId = authReq.user!.workspaceId;
  return filter;
}

export function canManageUser(actorRole: string, actorWsId: string, targetRole: string, targetWsId: string): boolean {
  const actorLevel = ROLE_HIERARCHY[actorRole] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0;
  if (actorLevel <= targetLevel) return false;
  if (actorRole === "ORG_ADMIN" || actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "WORKSPACE_MANAGER") return targetRole === "MEMBER" && actorWsId === targetWsId;
  return false;
}
