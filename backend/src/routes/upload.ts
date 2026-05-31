import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../config/connection.js";
import { Organization } from "../models/index.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

const memoryStorage = multer.memoryStorage();

// ── Image upload config ──────────────────────────────────────
const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, GIF, and SVG images allowed"));
  },
});

// ── Document/file upload config ──────────────────────────────
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
    else cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, TXT, ZIP, JSON`));
  },
});

// ── Generic upload helper ────────────────────────────────────
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

  return {
    url: `${process.env.R2_PUBLIC_URL}/${filename}`,
    key: filename,
  };
}

// ── Avatar upload ────────────────────────────────────────────
router.post("/avatar", authenticate, imageUpload.single("file"), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { url: avatarUrl } = await uploadToR2(req.file, "avatars");

    await connectDB();
    const member = await (await import("../models/index.js")).OrgMember.findOne({ userId: authReq.user!.userId }).lean() as any;
    if (member?.organizationId) {
      await Organization.findByIdAndUpdate(member.organizationId, { logoUrl: avatarUrl });
    }

    res.json({ success: true, url: avatarUrl, avatarUrl });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

// ── Image upload ─────────────────────────────────────────────
router.post("/image", authenticate, imageUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { url } = await uploadToR2(req.file, "images");
    res.json({ success: true, url });
  } catch (error: any) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

// ── Document/file upload ─────────────────────────────────────
router.post("/file", authenticate, fileUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { url, key } = await uploadToR2(req.file, "files");
    res.json({
      success: true,
      url,
      key,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

// ── Multiple files upload ────────────────────────────────────
router.post("/files", authenticate, fileUpload.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const results = await Promise.all(
      files.map(async (f) => {
        const { url, key } = await uploadToR2(f, "files");
        return { url, key, filename: f.originalname, mimetype: f.mimetype, size: f.size };
      })
    );

    res.json({ success: true, files: results, count: results.length });
  } catch (error: any) {
    console.error("Bulk file upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

// ── Delete file from R2 ──────────────────────────────────────
router.delete("/file", authenticate, async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key || typeof key !== "string") return res.status(400).json({ error: "File key required" });

    // Only allow deleting files from our bucket
    if (!key.match(/^(avatars|images|files)\//)) {
      return res.status(400).json({ error: "Invalid file key" });
    }

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }));

    res.json({ success: true });
  } catch (error: any) {
    console.error("File delete error:", error);
    res.status(500).json({ error: error.message || "Delete failed" });
  }
});

export default router;
