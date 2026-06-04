import { Request, Response } from "express";
import { projectService } from "../services/projectService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const projectController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const { projects, total } = await projectService.list(authReq.user!.organizationId, authReq.user!.workspaceId, params);
    apiResponse.paginated(res, projects, total, params.page, params.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const project = await projectService.getById(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, project, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const project = await projectService.create(authReq.user!.organizationId, authReq.user!.workspaceId || "", authReq.user!.userId, req.body);
    apiResponse.created(res, project, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const project = await projectService.update(req.params.id, authReq.user!.organizationId, req.body);
    apiResponse.success(res, project, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await projectService.delete(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
