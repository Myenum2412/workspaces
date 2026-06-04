import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { UserProfile, OrgMember, Organization } from "../models/index.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendSignupWelcomeEmail } from "../email/resend.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError, ConflictError } from "../core/errors/AppError.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validators/entity.js";
import { env } from "../config/env.js";

const router = Router();
router.use(authenticate);

// ── Helpers ────────────────────────────────────────────────────

async function getUserOrgId(userId: string): Promise<string | null> {
  const member = await OrgMember.findOne({ userId }).lean() as any;
  return member?.organizationId ?? null;
}

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// ── Employee Stats ─────────────────────────────────────────────

router.get("/stats", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;

  const [total, active, onLeave] = await Promise.all([
    UserProfile.countDocuments(filter),
    UserProfile.countDocuments({ ...filter, status: "active" }),
    UserProfile.countDocuments({ ...filter, status: { $in: ["inactive", "suspended"] } }),
  ]);

  apiResponse.success(res, {
    totalEmployees: total,
    activeNow: active,
    onLeave,
    assignedTasks: 0, // placeholder — compute via aggregation if needed
  });
}));

// ── List staff (Paginated) ─────────────────────────────────────

router.get("/", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const member = await OrgMember.findOne({ userId: authReq.user!.userId }).lean() as any;

  const query: any = { deletedAt: null };
  if (member?.organizationId) query.organizationId = member.organizationId;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [employees, total] = await Promise.all([
    UserProfile.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    UserProfile.countDocuments(query),
  ]);

  apiResponse.paginated(res, employees, total, page, limit, (req as any).requestId);
}));

// ── Create staff ────────────────────────────────────────────────

router.post("/",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(createEmployeeSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const member = await OrgMember.findOne({ userId: authReq.user!.userId }).lean() as any;
    const organizationId = member?.organizationId || "";

    const email = req.body.email.trim().toLowerCase();

    const existing = await UserProfile.findOne({ email, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Email already in use");

    const rawPassword = req.body.password || crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const newUserId = crypto.randomUUID();

    const newEmployee = await UserProfile.create({
      _id: newUserId,
      userId: req.body.userId || newUserId,
      email,
      passwordHash,
      avatarUrl: req.body.avatarUrl || "",
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      phone: req.body.mobile || req.body.phone || "",
      designation: req.body.designation || "Employee",
      department: req.body.department || "",
      status: req.body.status || "active",
      organizationId,
      empId: req.body.empId || `EMP-${Date.now().toString().slice(-4)}`,
      joiningDate: req.body.joiningDate || new Date().toISOString(),
      employmentType: req.body.employmentType || "full_time",
      role: req.body.role || "MEMBER",
    });

    if (organizationId) {
      await OrgMember.create({
        _id: crypto.randomUUID(),
        organizationId,
        userId: newEmployee.userId,
        role: req.body.role || "MEMBER",
        status: "active",
        joinedAt: new Date().toISOString(),
      });
    }

    sendSignupWelcomeEmail({
      to: email,
      name: req.body.firstName || "Employee",
      password: rawPassword,
      verifyUrl: `${env.FRONTEND_URL}/login`,
    }).catch((err: Error) => {
      console.warn("[Staff] Welcome email failed:", err.message);
    });

    apiResponse.created(res, {
      employee: newEmployee,
      password: rawPassword,
    }, (req as any).requestId);
  })
);

// ── Get by ID ──────────────────────────────────────────────────

router.get("/:id", catchAsync(async (req: Request, res: Response) => {
  const employee = await UserProfile.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!employee) throw new NotFoundError("Employee");
  apiResponse.success(res, { employee }, 200, (req as any).requestId);
}));

// ── Update ─────────────────────────────────────────────────────

router.put("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(updateEmployeeSchema),
  catchAsync(async (req: Request, res: Response) => {
    delete req.body._id;
    delete req.body.userId;
    delete req.body.organizationId;
    delete req.body.passwordHash;

    const employee = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!employee) throw new NotFoundError("Employee");
    apiResponse.success(res, { employee }, 200, (req as any).requestId);
  })
);

// ── Soft delete ────────────────────────────────────────────────

router.delete("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const employee = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!employee) throw new NotFoundError("Employee");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

// ── Restore ────────────────────────────────────────────────────

router.post("/:id/restore",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const restored = await UserProfile.findOneAndUpdate(
      { _id: req.params.id, organizationId: authReq.user!.organizationId, deletedAt: { $ne: null } },
      { $unset: { deletedAt: 1 } },
      { new: true }
    ).lean();
    if (!restored) throw new NotFoundError("Employee not found or not deleted");
    apiResponse.success(res, { employee: restored }, 200, (req as any).requestId);
  })
);

export default router;
