import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../config/connection.js";
import { Organization } from "../models/index.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "avatars"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

    const avatarUrl = `/uploads/avatars/${file.filename}`;

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

export default router;
