import { Router, Request, Response } from "express";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { UserProfile, OrgMember, Organization } from "../models/index.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendSignupWelcomeEmail } from "../email/resend.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError, ConflictError, AuthorizationError } from "../core/errors/AppError.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { createStaffSchema, updateStaffSchema } from "../validators/entity.js";
import { env } from "../config/env.js";
import { isSuperAdmin } from "../config/env.js";

const router = Router();
router.use(authenticate);

async function getUserOrgId(userId: string): Promise<string | null> {
  const member = await OrgMember.findOne({ userId }).lean() as any;
  return member?.organizationId ?? null;
}

// List all staff in user's org
router.get("/", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const actor = authReq.user!;
  const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;

  const query: any = { deletedAt: null };
  if (member?.organizationId) {
    query.organizationId = member.organizationId;
  }

  const staffs = await UserProfile.find(query).lean();
  apiResponse.success(res, { staffs });
}));

// Create staff — admin/owner only
router.post("/",
  requireRole("admin", "owner"),
  validateBody(createStaffSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    const organizationId = member?.organizationId || "";

    const email = req.body.email.trim().toLowerCase();

    // Check email uniqueness (case-insensitive, excluding soft-deleted)
    const existing = await UserProfile.findOne({ email, deletedAt: null }).lean();
    if (existing) {
      throw new ConflictError("Email already in use");
    }

    const rawPassword = req.body.password || crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const newUserId = crypto.randomUUID();

    const newStaff = await UserProfile.create({
      _id: newUserId,
      userId: req.body.userId || newUserId,
      email,
      passwordHash,
      avatarUrl: req.body.avatarUrl || "",
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      phone: req.body.mobile || req.body.phone || "",
      designation: req.body.designation || "Staff",
      department: req.body.department || "",
      status: req.body.status || "active",
      organizationId,
      role: req.body.role || "staff",
      empId: req.body.empId || `EMP-${Date.now().toString().slice(-4)}`,
      joiningDate: req.body.joiningDate || new Date().toISOString(),
      employmentType: req.body.employmentType || "Full Time",
      currentExperience: req.body.currentExperience || "",
      totalExperience: req.body.totalExperience || "",
      dob: req.body.dob || "",
      gender: req.body.gender || "",
      maritalStatus: req.body.maritalStatus || "",
      sourceOfHire: req.body.sourceOfHire || "",
      bio: req.body.bio || "",
      expertise: req.body.expertise || [],
      pan: req.body.pan || "",
      aadhaar: req.body.aadhaar || "",
      uan: req.body.uan || "",
      presentAddress: req.body.presentAddress || "",
      permanentAddress: req.body.permanentAddress || "",
      personalPhone: req.body.personalPhone || "",
      personalEmail: req.body.personalEmail || "",
      category: req.body.category || "",
      workExperience: req.body.workExperience || [],
      educationDetails: req.body.educationDetails || [],
      dependentDetails: req.body.dependentDetails || [],
    });

    if (organizationId) {
      await OrgMember.create({
        _id: crypto.randomUUID(),
        organizationId,
        userId: newStaff.userId,
        role: newStaff.role,
        status: "active",
        joinedAt: new Date().toISOString(),
      });
    }

    // Send welcome email (non-blocking)
    sendSignupWelcomeEmail({
      to: email,
      name: req.body.firstName || "Staff Member",
      password: rawPassword,
      verifyUrl: `${env.FRONTEND_URL}/login`,
    }).catch((err: Error) => {
      console.warn("[Staff] Welcome email failed:", err.message);
    });

    apiResponse.created(res, {
      staff: newStaff,
      password: rawPassword,
    });
  })
);

// Get staff by ID
router.get("/:id", catchAsync(async (req: Request, res: Response) => {
  const staff = await UserProfile.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!staff) throw new NotFoundError("Staff");
  apiResponse.success(res, { staff });
}));

// Update staff — admin/owner only
router.put("/:id",
  requireRole("admin", "owner"),
  validateBody(updateStaffSchema),
  catchAsync(async (req: Request, res: Response) => {
    // Prevent changing protected fields
    delete req.body._id;
    delete req.body.userId;
    delete req.body.organizationId;
    delete req.body.passwordHash;

    const staff = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!staff) throw new NotFoundError("Staff");
    apiResponse.success(res, { staff });
  })
);

// Delete staff (soft delete) — admin/owner only, same org
router.delete("/:id",
  requireRole("admin", "owner"),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const staff = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!staff) throw new NotFoundError("Staff");
    apiResponse.success(res, { success: true });
  })
);

// Restore staff — admin/owner only, same org
router.post("/:id/restore",
  requireRole("admin", "owner"),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const restored = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: { $ne: null } },
      { $unset: { deletedAt: 1 } },
      { new: true }
    ).lean();
    if (!restored) throw new NotFoundError("Staff not found or not deleted");
    apiResponse.success(res, { staff: restored });
  })
);

export default router;
