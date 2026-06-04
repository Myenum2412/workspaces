import { Request, Response } from "express";
import multer from "multer";
import { fileService } from "../services/fileService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { env } from "../../../config/env.js";
import { parsePagination } from "../../../middleware/pagination.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_FILE_SIZE } });

export const uploadSingle = upload.single("file");

export const fileController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const { files, total } = await fileService.list(authReq.user!.organizationId, authReq.user!.workspaceId, { ...params, folder: req.query.folder as string });
    apiResponse.paginated(res, files, total, params.page, params.limit, req.requestId);
  }),

  upload: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (!req.file) throw new Error("No file uploaded");
    const folder = (req.body.folder as string) || "general";
    const file = await fileService.upload(authReq.user!.userId, `${authReq.user!.role}`, authReq.user!.organizationId, authReq.user!.workspaceId || "", req.file, folder);
    apiResponse.created(res, file, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await fileService.delete(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
