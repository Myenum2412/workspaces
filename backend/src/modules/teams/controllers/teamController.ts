// @ts-nocheck
import { Request, Response } from "express";
import { teamService } from "../services/teamService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { parsePagination } from "../../../middleware/pagination.js";

export const teamController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const { data: teams, total } = await teamService.list(authReq.user!.organizationId, authReq.user!.workspaceId, params);
    apiResponse.paginated(res, teams, total, params.page, params.limit, req.requestId);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const team = await teamService.getById(req.params.id as string, authReq.user!.organizationId);
    apiResponse.success(res, team, 200, req.requestId);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const team = await teamService.create(authReq.user!.organizationId, authReq.user!.workspaceId || "", req.body);
    apiResponse.created(res, team, req.requestId);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const team = await teamService.update(req.params.id as string, authReq.user!.organizationId, req.body);
    apiResponse.success(res, team, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await teamService.remove(req.params.id as string, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  addMember: catchAsync(async (req: Request, res: Response) => {
    const { userId, role } = req.body;
    const result = await teamService.addMember(req.params.id, userId, role);
    apiResponse.created(res, result, req.requestId);
  }),

  removeMember: catchAsync(async (req: Request, res: Response) => {
    const result = await teamService.removeMember(req.params.id, req.params.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
