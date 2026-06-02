import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { logAudit } from "../middleware/audit.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { FileRecord } from "../models/file-record.js";

const router = Router();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const memoryStorage = multer.memoryStorage();

const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, GIF, and SVG images allowed"));
  },
});

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/json",
];

const fileUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_DOC_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

async function uploadToR2(file: Express.Multer.File, folder: string): Promise<{ url: string; key: string }> {
  const ext = path.extname(file.originalname);
  const filename = `${folder}/${crypto.randomUUID()}${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentDisposition: `inline; filename="${file.originalname}"`,
  }));
  
  const baseUrl = process.env.R2_PUBLIC_URL;
  const url = baseUrl ? `${baseUrl.replace(/\/$/, "")}/${filename}` : `/api/upload/media/${filename}`;
  return { url, key: filename };
}

async function createFileRecord(req: Request, file: Express.Multer.File, folder: string, url: string, key: string) {
  const authReq = req as AuthRequest;
  try {
    await FileRecord.create({
      _id: crypto.randomUUID(),
      organizationId: authReq.user?.organizationId || "unknown",
      userId: authReq.user?.userId || "unknown",
      userName: authReq.user?.email || "unknown",
      filename: key.split("/").pop() || file.originalname,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      key,
      folder,
    });
  } catch (err: any) {
    console.error("[Upload] FileRecord creation failed:", err.message);
    // Non-blocking — upload already succeeded
  }
}

function auditFileAction(req: Request, action: string, metadata: Record<string, unknown> = {}) {
  const authReq = req as AuthRequest;
  logAudit({
    organizationId: authReq.user?.organizationId || "unknown",
    action,
    severity: "info",
    userId: authReq.user?.userId || null,
    userEmail: authReq.user?.email || null,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
    method: req.method,
    path: req.originalUrl || req.path,
    metadata,
  }).catch(() => {/* silent */});
}

// ── Serve media from R2 (Proxy) ───────────────────────────────
router.get("/media/:folder/:filename", catchAsync(async (req: Request, res: Response) => {
  const { folder, filename } = req.params;
  if (!["avatars", "images", "files"].includes(folder)) {
    return res.status(400).json({ error: "Invalid folder" });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `${folder}/${filename}`,
  });

  const response = await s3.send(command);
  if (!response.Body) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  if (response.ContentLength) {
    res.setHeader("Content-Length", response.ContentLength);
  }

  // @ts-ignore — stream pipe
  response.Body.pipe(res);
}));

// ── Avatar upload ────────────────────────────────────────────
router.post("/avatar", authenticate, imageUpload.single("file"), catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { url: avatarUrl, key: avatarKey } = await uploadToR2(req.file, "avatars");
  const UserProfile = (await import("../models/index.js")).UserProfile;
  await UserProfile.findOneAndUpdate({ userId: authReq.user!.userId }, { avatarUrl });
  createFileRecord(req, req.file, "avatars", avatarUrl, avatarKey);

  auditFileAction(req, "file_avatar_upload", { size: req.file.size, mimetype: req.file.mimetype });
  apiResponse.success(res, { url: avatarUrl, avatarUrl });
}));

// ── Image upload ─────────────────────────────────────────────
router.post("/image", authenticate, imageUpload.single("file"), catchAsync(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { url, key } = await uploadToR2(req.file, "images");
  createFileRecord(req, req.file, "images", url, key);

  auditFileAction(req, "file_image_upload", { size: req.file.size, mimetype: req.file.mimetype });
  apiResponse.success(res, { url });
}));

// ── Document/file upload ─────────────────────────────────────
router.post("/file", authenticate, fileUpload.single("file"), catchAsync(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { url, key } = await uploadToR2(req.file, "files");
  createFileRecord(req, req.file, "files", url, key);

  auditFileAction(req, "file_upload", { key, size: req.file.size, mimetype: req.file.mimetype, filename: req.file.originalname });
  apiResponse.success(res, { url, key, filename: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size });
}));

// ── Multiple files upload ────────────────────────────────────
router.post("/files", authenticate, fileUpload.array("files", 10), catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

  const results = await Promise.all(
    files.map(async (f) => {
      const { url, key } = await uploadToR2(f, "files");
      createFileRecord(req, f, "files", url, key);
      return { url, key, filename: f.originalname, mimetype: f.mimetype, size: f.size };
    })
  );

  auditFileAction(req, "file_bulk_upload", { count: results.length });
  apiResponse.success(res, { files: results, count: results.length });
}));

// ── Delete file from R2 ──────────────────────────────────────
router.delete("/file", authenticate, catchAsync(async (req: Request, res: Response) => {
  const { key } = req.body;
  if (!key || typeof key !== "string") return res.status(400).json({ error: "File key required" });
  if (!key.match(/^(avatars|images|files)\//)) {
    return res.status(400).json({ error: "Invalid file key" });
  }

  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }));

  // Remove FileRecord if exists
  await FileRecord.findOneAndDelete({ key }).catch(() => { /* silent */ });

  auditFileAction(req, "file_delete", { key });
  apiResponse.success(res, { success: true });
}));

export default router;
