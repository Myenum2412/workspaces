// @ts-nocheck
import { Request, Response } from "express";
import { searchService } from "../services/searchService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";

export const searchController = {
  global: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const q = (req.query.q as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    if (!q || q.length < 2) return apiResponse.success(res, { tasks: [], projects: [], users: [], teams: [] }, 200, req.requestId);
    const results = await searchService.globalSearch(authReq.user!.organizationId, q, { page, limit });
    apiResponse.success(res, results, 200, req.requestId);
  }),
};
