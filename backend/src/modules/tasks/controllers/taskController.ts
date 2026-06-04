import { Request, Response } from "express";
import { taskService } from "../services/taskService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const taskController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const query = req.query as Record<string, unknown>;
    const { tasks, total } = await taskService.list(authReq.user!.organizationId, authReq.user!.workspaceId, { ...params, status: query.status as string, priority: query.priority as string, assignedTo: query.assignedTo as string, projectId: query.projectId as string });
    apiResponse.paginated(res, tasks, total, params.page, params.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const task = await taskService.getById(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, task, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const task = await taskService.create(authReq.user!.organizationId, authReq.user!.workspaceId || "", authReq.user!.userId, req.body);
    apiResponse.created(res, task, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const task = await taskService.update(req.params.id, authReq.user!.organizationId, req.body);
    apiResponse.success(res, task, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await taskService.delete(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
