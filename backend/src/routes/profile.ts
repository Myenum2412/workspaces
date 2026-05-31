/**
 * Profile management routes — CRUD, history, activity, avatar admin.
 */
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "../config/connection.js";
import { UserProfile, OrgMember } from "../models/index.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  updateProfileSchema,
  adminUpdateProfileSchema,
  profileQuerySchema,
  paginationSchema,
  adminStatusSchema,
} from "../validators/profile.js";
import { ProfileService } from "../services/profile.js";

const router = Router();

// All routes require auth
router.use(authenticate);

// ── RBAC helper ─────────────────────────────────────────────
async function authorizeProfile(req: AuthRequest, res: Response, targetUserId: string): Promise<boolean> {
  const actor = req.user!;
  if (actor.userId === targetUserId) return true;

  // Admin or owner in same org can manage other profiles
  if (actor.role === "admin" || actor.role === "owner") {
    return true;
  }

  return false;
}

// ── GET /api/profile — own profile ──────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const profile = await ProfileService.getProfile(authReq.user!.userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true, profile });
  } catch (error: any) {
    console.error("[Profile] Get error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch profile" });
  }
});

// ── PATCH /api/profile — update own profile ─────────────────
router.patch("/", validateBody(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const changes = req.body;
    const userId = authReq.user!.userId;

    // Uniqueness check for email/phone if being changed
    if (changes.email) {
      const existing = await UserProfile.findOne({ email: changes.email, _id: { $ne: userId } }).lean();
      if (existing) return res.status(409).json({ error: "Email already in use" });
    }
    if (changes.personalEmail) {
      const existing = await UserProfile.findOne({ personalEmail: changes.personalEmail, _id: { $ne: userId } }).lean();
      if (existing) return res.status(409).json({ error: "Personal email already in use" });
    }

    const updated = await ProfileService.updateProfile(userId, changes, userId, authReq.user!.email);
    res.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("[Profile] Update error:", error);
    if (error.message === "User not found") return res.status(404).json({ error: "Profile not found" });
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

// ── GET /api/profile/history — own change history ───────────
router.get("/history", validateBody(paginationSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { page, limit } = paginationSchema.parse(req.query);
    const history = await ProfileService.getProfileHistory(authReq.user!.userId, page, limit);
    res.json({ success: true, ...history });
  } catch (error: any) {
    console.error("[Profile] History error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch history" });
  }
});

// ── GET /api/profile/activity — own activity log ─────────────
router.get("/activity", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const activity = await ProfileService.getProfileActivity(authReq.user!.userId, days);
    res.json({ success: true, activity });
  } catch (error: any) {
    console.error("[Profile] Activity error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch activity" });
  }
});

// ── GET /api/profile/export — export own profile data ────────
router.get("/export", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const data = await ProfileService.exportProfile(authReq.user!.userId);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="profile-${authReq.user!.userId}.json"`);
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("[Profile] Export error:", error);
    res.status(500).json({ error: error.message || "Failed to export profile" });
  }
});

// ── POST /api/profile/avatar — upload avatar ─────────────────
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads", "avatars"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and GIF allowed"));
  },
});

router.post("/avatar", avatarUpload.single("file"), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await ProfileService.updateProfileImage(authReq.user!.userId, avatarUrl);

    // Log activity
    await ProfileService.logActivity({
      userId: authReq.user!.userId,
      action: "avatar_change",
      metadata: { avatarUrl },
      req,
    });

    res.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error("[Profile] Avatar upload error:", error);
    res.status(500).json({ error: error.message || "Avatar upload failed" });
  }
});

// ══════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════

// ── PATCH /api/profile/:userId — admin update any profile ────
router.patch("/:userId", validateBody(adminUpdateProfileSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { userId } = req.params;
    const changes = req.body;

    if (!(await authorizeProfile(authReq, res, userId))) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    if (changes.email) {
      const existing = await UserProfile.findOne({ email: changes.email, _id: { $ne: userId } }).lean();
      if (existing) return res.status(409).json({ error: "Email already in use" });
    }

    const updated = await ProfileService.updateProfile(userId, changes, authReq.user!.userId, authReq.user!.email);

    // Log admin activity
    await ProfileService.logActivity({
      userId: authReq.user!.userId,
      action: "admin_update",
      metadata: { targetUserId: userId, changes: Object.keys(changes) },
    });

    res.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("[Profile] Admin update error:", error);
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
});

// ── GET /api/profile/admin/users — list org users ────────────
router.get("/admin/users", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;

    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get actor's org
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    if (!member) return res.status(400).json({ error: "Not a member of any organization" });

    const filters = profileQuerySchema.parse(req.query);
    const result = await ProfileService.listProfiles(member.organizationId, filters);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[Profile] Admin list error:", error);
    res.status(500).json({ error: error.message || "Failed to list profiles" });
  }
});

// ── PATCH /api/profile/admin/users/:userId/status — suspend/activate ─
router.patch("/admin/users/:userId/status", validateBody(adminStatusSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { userId } = req.params;
    const { status, reason } = req.body;

    const actor = authReq.user!;
    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (actor.userId === userId) {
      return res.status(400).json({ error: "Cannot change own status" });
    }

    const updated = await ProfileService.adminSetStatus(userId, status, reason, actor.userId, actor.email);
    res.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error("[Profile] Admin status error:", error);
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
});

export default router;
