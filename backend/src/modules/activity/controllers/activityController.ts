import { Request, Response } from "express";
import { activityService } from "../services/activityService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const activityController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const q = req.query as Record<string, unknown>;
    const { activities, total } = await activityService.list(authReq.user!.organizationId, { ...params, userId: q.userId as string, entityType: q.entityType as string, action: q.action as string, fromDate: q.fromDate as string, toDate: q.toDate as string });
    apiResponse.paginated(res, activities, total, params.page, params.limit, req.requestId);
  }),

  auditLogs: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const q = req.query as Record<string, unknown>;
    const { logs, total } = await activityService.listAuditLogs(authReq.user!.organizationId, { ...params, severity: q.severity as string, action: q.action as string });
    apiResponse.paginated(res, logs, total, params.page, params.limit, req.requestId);
  }),
};
