// @ts-nocheck
import { Request, Response } from "express";
import { workspaceService } from "../services/workspaceService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const workspaceController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const result = await workspaceService.list(authReq.user!.organizationId, params);
    apiResponse.paginated(res, result.data, result.total, result.page, result.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.getById(req.params.id as string, authReq.user!.organizationId);
    apiResponse.success(res, ws, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.create(authReq.user!.organizationId, authReq.user!.userId, req.body);
    apiResponse.created(res, ws, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.update(req.params.id as string, authReq.user!.organizationId, req.body);
    apiResponse.success(res, ws, 200, req.requestId);
  }),

  remove: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await workspaceService.remove(req.params.id as string, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
