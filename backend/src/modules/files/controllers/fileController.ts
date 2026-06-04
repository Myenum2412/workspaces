import crypto from "crypto";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { fileService } from "../services/fileService.js";
import { catchAsync } from "../../../core/utils/catchAsync.js";
import { apiResponse } from "../../../core/utils/apiResponse.js";
import { AuthRequest } from "../../../middleware/auth.js";
import { BadRequestError } from "../../../core/errors/AppError.js";
import { env } from "../../../config/env.js";
import { parsePagination } from "../../../middleware/pagination.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".csv",
]);

function validateFileType(originalname: string, mimetype: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  if (!ALLOWED_MIME_TYPES.has(mimetype)) return false;
  return true;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (validateFileType(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type not allowed: ${file.mimetype}`));
    }
  },
});

export const uploadSingle = upload.single("file");

export const fileController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const params = parsePagination(req.query as Record<string, unknown>);
    const { files, total } = await fileService.list(
      authReq.user!.organizationId,
      authReq.user!.workspaceId,
      { ...params, folder: req.query.folder as string },
    );
    apiResponse.paginated(res, files, total, params.page, params.limit, req.requestId);
  }),

  upload: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    if (!req.file) throw new BadRequestError("No file uploaded");
    const folder = (req.body.folder as string) || "general";
    const file = await fileService.upload(
      authReq.user!.userId,
      `${authReq.user!.role}`,
      authReq.user!.organizationId,
      authReq.user!.workspaceId || "",
      req.file,
      folder,
    );
    apiResponse.created(res, file, req.requestId);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const result = await fileService.remove(req.params.id, authReq.user!.organizationId);
    apiResponse.success(res, result, 200, req.requestId);
  }),
};
