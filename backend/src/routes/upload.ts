import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../config/connection.js";
import { Organization } from "../models/index.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

router.post("/avatar", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = path.extname(file.originalname);
    const filename = `profile_images/${crypto.randomUUID()}${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const avatarUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;

    await connectDB();

    // Try to find user's org and update logoUrl
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

router.post("/image", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const ext = path.extname(file.originalname);
    const filename = `profile_images/${crypto.randomUUID()}${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`;
    res.json({ success: true, url });
  } catch (error: any) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

export default router;
