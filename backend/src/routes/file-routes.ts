import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { catchAsync } from "../core/utils/catchAsync.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { logAudit } from "../middleware/audit.js";
import { parsePagination } from "../middleware/pagination.js";
import { FileRecord } from "../models/file-record.js";
import crypto from "crypto";

const router = Router();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

router.use(authenticate);

// ── List files ────────────────────────────────────────────────
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = authReq.user!.organizationId;
  const params = parsePagination(req.query as any);
  const folder = (req.query.folder as string || "").trim();

  const filter: Record<string, unknown> = { organizationId: orgId };
  if (folder) filter.folder = folder;

  const skip = (params.page - 1) * params.limit;
  const [files, total] = await Promise.all([
    FileRecord.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.limit).lean(),
    FileRecord.countDocuments(filter),
  ]);

  apiResponse.success(res, {
    files,
    total,
    page: params.page,
    limit: params.limit,
    pages: Math.ceil(total / params.limit),
  });
}));

// ── List distinct folders ─────────────────────────────────────
router.get("/folders", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = authReq.user!.organizationId;

  const folders = (await FileRecord.distinct("folder", { organizationId: orgId })) as string[];
  folders.sort();

  apiResponse.success(res, { folders });
}));

// ── Create file record (after R2 upload) ──────────────────────
router.post("/record", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { filename, originalName, mimetype, size, url, key, folder } = req.body;

  if (!filename || !key || !url) {
    return res.status(400).json({ error: "filename, key, and url required" });
  }

  const record = await FileRecord.create({
    _id: crypto.randomUUID(),
    organizationId: authReq.user!.organizationId,
    userId: authReq.user!.userId,
    userName: authReq.user!.email,
    filename,
    originalName: originalName || filename,
    mimetype: mimetype || "application/octet-stream",
    size: size || 0,
    url,
    key,
    folder: folder || key.split("/")[0] || "files",
  });

  logAudit({
    organizationId: authReq.user!.organizationId,
    action: "file_record_create",
    severity: "info",
    userId: authReq.user!.userId,
    userEmail: authReq.user!.email,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
    method: req.method,
    path: req.originalUrl || req.path,
    metadata: { fileId: record._id, key },
  }).catch(() => { /* silent */ });

  apiResponse.success(res, { file: record });
}));

// ── Delete file (R2 + DB) ──────────────────────────────────────
router.delete("/:id", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = authReq.user!.organizationId;
  const { id } = req.params;

  const record = await FileRecord.findOneAndDelete({
    _id: id,
    organizationId: orgId,
  }).lean() as any;

  if (!record) {
    return res.status(404).json({ error: "File not found" });
  }

  // Delete from R2
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: record.key,
    }));
  } catch (s3Err: any) {
    console.error("[FileRoutes] R2 delete error:", s3Err.message);
    // Continue — DB record already removed
  }

  logAudit({
    organizationId: orgId,
    action: "file_delete",
    severity: "info",
    userId: authReq.user!.userId,
    userEmail: authReq.user!.email,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
    method: req.method,
    path: req.originalUrl || req.path,
    metadata: { fileId: id, key: record.key },
  }).catch(() => { /* silent */ });

  apiResponse.success(res, { success: true });
}));

export default router;
