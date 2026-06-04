import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { Organization, OrgMember, OrgInvitation, MasterData, UserProfile } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError, AuthorizationError } from "../core/errors/AppError.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { validateBody } from "../middleware/validate.js";
import {
  updateOrganizationSchema,
  createMemberSchema,
  updateMemberSchema,
  createInvitationSchema,
  createMasterDataSchema,
  updateMasterDataSchema,
} from "../validators/entity.js";

const router = Router();
router.use(authenticate);

// ── Helpers ────────────────────────────────────────────────────

async function orgId(userId: string): Promise<string | null> {
  const m = await OrgMember.findOne({ userId }).lean() as any;
  return m?.organizationId ?? null;
}

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

/** Verify user belongs to the org they're accessing */
async function requireOrgAccess(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const userOrgId = await orgId(authReq.user!.userId);
  const targetOrgId = req.params.id || req.body.organizationId;
  if (targetOrgId && userOrgId && targetOrgId !== userOrgId) {
    throw new AuthorizationError("You do not have access to this organization");
  }
  next();
}

// ── Org Stats ──────────────────────────────────────────────────

router.get("/organizations/:id/stats", catchAsync(async (req, res) => {
  const oid = req.params.id;
  const [totalMembers, activeMembers, pendingInvites, totalProfiles] = await Promise.all([
    OrgMember.countDocuments({ organizationId: oid }),
    OrgMember.countDocuments({ organizationId: oid, status: "active" }),
    OrgInvitation.countDocuments({ organizationId: oid, status: "pending" }),
    UserProfile.countDocuments({ organizationId: oid, deletedAt: null }),
  ]);

  apiResponse.success(res, {
    totalMembers,
    activeMembers,
    pendingInvites,
    totalProfiles,
  });
}));

// ── Organizations ──────────────────────────────────────────────

router.get("/organizations/:id", catchAsync(async (req, res) => {
  const org = await Organization.findById(req.params.id).lean();
  if (!org) throw new NotFoundError("Organization");
  apiResponse.success(res, { organization: org }, 200, (req as any).requestId);
}));

router.put("/organizations/:id",
  requireRole("ORG_ADMIN"),
  requireOrgAccess,
  validateBody(updateOrganizationSchema),
  catchAsync(async (req, res) => {
    delete req.body._id;
    delete req.body.ownerId;
    delete req.body.ownerEmail;
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!org) throw new NotFoundError("Organization");
    apiResponse.success(res, { organization: org }, 200, (req as any).requestId);
  })
);

// ── Org Members (Paginated) ────────────────────────────────────

router.get("/members", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = {};
  if (oid) filter.organizationId = oid;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [members, total] = await Promise.all([
    OrgMember.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    OrgMember.countDocuments(filter),
  ]);

  apiResponse.paginated(res, members, total, page, limit, (req as any).requestId);
}));

router.get("/members/:id", catchAsync(async (req, res) => {
  const member = await OrgMember.findById(req.params.id).lean();
  if (!member) throw new NotFoundError("Member");
  apiResponse.success(res, { member }, 200, (req as any).requestId);
}));

router.post("/members",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(createMemberSchema),
  catchAsync(async (req, res) => {
    const member = await OrgMember.create(req.body);
    apiResponse.created(res, { member }, (req as any).requestId);
  })
);

router.put("/members/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(updateMemberSchema),
  catchAsync(async (req, res) => {
    const member = await OrgMember.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!member) throw new NotFoundError("Member");
    apiResponse.success(res, { member }, 200, (req as any).requestId);
  })
);

router.delete("/members/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const member = await OrgMember.findByIdAndDelete(req.params.id).lean();
    if (!member) throw new NotFoundError("Member");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

// ── Org Invitations (Paginated) ────────────────────────────────

router.get("/invitations", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = {};
  if (oid) filter.organizationId = oid;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [invitations, total] = await Promise.all([
    OrgInvitation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    OrgInvitation.countDocuments(filter),
  ]);

  apiResponse.paginated(res, invitations, total, page, limit, (req as any).requestId);
}));

router.get("/invitations/:id", catchAsync(async (req, res) => {
  const inv = await OrgInvitation.findById(req.params.id).lean();
  if (!inv) throw new NotFoundError("Invitation");
  apiResponse.success(res, { invitation: inv }, 200, (req as any).requestId);
}));

router.post("/invitations",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(createInvitationSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const oid = await orgId(authReq.user!.userId);
    const inv = await OrgInvitation.create({
      ...req.body,
      _id: crypto.randomUUID(),
      organizationId: oid ?? "",
      invitedBy: authReq.user!.userId,
      token: crypto.randomUUID(),
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    apiResponse.created(res, { invitation: inv }, (req as any).requestId);
  })
);

router.put("/invitations/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const inv = await OrgInvitation.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!inv) throw new NotFoundError("Invitation");
    apiResponse.success(res, { invitation: inv }, 200, (req as any).requestId);
  })
);

router.delete("/invitations/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const inv = await OrgInvitation.findByIdAndDelete(req.params.id).lean();
    if (!inv) throw new NotFoundError("Invitation");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

// ── Master Data (Paginated) ────────────────────────────────────

router.get("/master-data", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (oid) filter.organizationId = oid;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [masterData, total] = await Promise.all([
    MasterData.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    MasterData.countDocuments(filter),
  ]);

  apiResponse.paginated(res, masterData, total, page, limit, (req as any).requestId);
}));

router.get("/master-data/:id", catchAsync(async (req, res) => {
  const item = await MasterData.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!item) throw new NotFoundError("MasterData");
  apiResponse.success(res, { masterData: item }, 200, (req as any).requestId);
}));

router.post("/master-data",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(createMasterDataSchema),
  catchAsync(async (req, res) => {
    const oid = await orgId((req as AuthRequest).user!.userId);
    const item = await MasterData.create({ ...req.body, organizationId: oid ?? "" });
    apiResponse.created(res, { masterData: item }, (req as any).requestId);
  })
);

router.put("/master-data/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(updateMasterDataSchema),
  catchAsync(async (req, res) => {
    const item = await MasterData.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!item) throw new NotFoundError("MasterData");
    apiResponse.success(res, { masterData: item }, 200, (req as any).requestId);
  })
);

router.delete("/master-data/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const item = await MasterData.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!item) throw new NotFoundError("MasterData");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

export default router;
