import { Request, Response } from "express";
import { settingService } from "../services/settingService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";

export const settingController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const settings = await settingService.list(authReq.user!.organizationId);
    apiResponse.success(res, settings, 200, req.requestId);
  }),

  get: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const setting = await settingService.get(authReq.user!.organizationId, req.params.key);
    apiResponse.success(res, setting, 200, req.requestId);
  }),

  upsert: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { key, value } = req.body;
    const setting = await settingService.upsert(authReq.user!.organizationId, key, value, authReq.user!.userId);
    apiResponse.success(res, setting, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await settingService.delete(authReq.user!.organizationId, req.params.key);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  getBranding: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const branding = await settingService.getBranding(authReq.user!.organizationId);
    apiResponse.success(res, branding, 200, req.requestId);
  }),

  updateBranding: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const branding = await settingService.updateBranding(authReq.user!.organizationId, req.body, authReq.user!.userId);
    apiResponse.success(res, branding, 200, req.requestId);
  }),
};
