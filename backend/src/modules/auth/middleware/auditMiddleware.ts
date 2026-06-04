// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { activityService } from "../../activity/services/activityService.js";
import { AuthRequest } from "../../../middleware/auth.js";

export function auditAction(action: string, entityType: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (authReq.user) {
      activityService.log({
        organizationId: authReq.user.organizationId,
        workspaceId: authReq.user.workspaceId || undefined,
        userId: authReq.user.userId,
        action,
        entityType,
        entityId: req.params.id || "unknown",
        ipAddress: req.ip || undefined,
        userAgent: req.headers["user-agent"] || undefined,
      }).catch(() => {});
    }
    next();
  };
}
