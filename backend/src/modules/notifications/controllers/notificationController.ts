import { Request, Response } from "express";
import { notificationService } from "../services/notificationService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";

export const notificationController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === "true";
    const { notifications, total, unreadCount } = await notificationService.list(authReq.user!.userId, { page, limit, unreadOnly });
    apiResponse.success(res, { notifications, unreadCount }, 200, req.requestId, { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 });
  }),

  markRead: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await notificationService.markRead(req.params.id, authReq.user!.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  markAllRead: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await notificationService.markAllRead(authReq.user!.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await notificationService.delete(req.params.id, authReq.user!.userId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
