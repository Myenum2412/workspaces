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
    const { workspaces, total } = await workspaceService.list(authReq.user!.organizationId, params);
    apiResponse.paginated(res, workspaces, total, params.page, params.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.getById(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, ws, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.create(authReq.user!.organizationId, authReq.user!.userId, req.body);
    apiResponse.created(res, ws, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const ws = await workspaceService.update(req.params.id, authReq.user!.organizationId, req.body);
    apiResponse.success(res, ws, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await workspaceService.delete(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
