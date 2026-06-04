import { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const userController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const { users, total } = await userService.list(authReq.user!.organizationId, params);
    apiResponse.paginated(res, users, total, params.page, params.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const user = await userService.getById(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, user, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await userService.create(authReq.user!.userId, authReq.user!.organizationId, req.body);
    apiResponse.created(res, result, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const user = await userService.update(req.params.id, authReq.user!.organizationId, req.body);
    apiResponse.success(res, user, 200, req.requestId);
  }),

  updateRole: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { role, workspaceId } = req.body;
    const result = await userService.updateRole(req.params.id, authReq.user!.organizationId, role, workspaceId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await userService.delete(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  bulkAction: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { userIds, action } = req.body;
    const result = await userService.bulkAction(authReq.user!.organizationId, userIds, action);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
