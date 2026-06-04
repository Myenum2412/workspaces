// @ts-nocheck
import { Request, Response } from "express";
import { dashboardService } from "../services/dashboardService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";

export const dashboardController = {
  stats: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const stats = await dashboardService.getStats(authReq.user!.organizationId, authReq.user!.workspaceId);
    apiResponse.success(res, stats, 200, req.requestId);
  }),

  myTasks: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const stats = await dashboardService.getMyTasks(authReq.user!.userId, authReq.user!.organizationId);
    apiResponse.success(res, stats, 200, req.requestId);
  }),
};
