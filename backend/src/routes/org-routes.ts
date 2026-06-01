import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { Organization, OrgMember, OrgInvitation, MasterData } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError, AuthorizationError } from "../core/errors/AppError.js";
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

async function orgId(userId: string): Promise<string | null> {
  const m = await OrgMember.findOne({ userId }).lean() as any;
  return m?.organizationId ?? null;
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

// ── Organizations ──────────────────────────────────────────────

router.get("/organizations/:id", catchAsync(async (req, res) => {
  const org = await Organization.findById(req.params.id).lean();
  if (!org) throw new NotFoundError("Organization");
  res.json({ success: true, organization: org });
}));

router.put("/organizations/:id",
  requireRole("admin", "owner"),
  requireOrgAccess,
  validateBody(updateOrganizationSchema),
  catchAsync(async (req, res) => {
    // Prevent changing ownership fields
    delete req.body._id;
    delete req.body.ownerId;
    delete req.body.ownerEmail;
    const org = await Organization.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!org) throw new NotFoundError("Organization");
    res.json({ success: true, organization: org });
  })
);

// ── Org Members ───────────────────────────────────────────────

router.get("/members", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = {};
  if (oid) filter.organizationId = oid;
  res.json({ success: true, members: await OrgMember.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/members/:id", catchAsync(async (req, res) => {
  const member = await OrgMember.findById(req.params.id).lean();
  if (!member) throw new NotFoundError("Member");
  res.json({ success: true, member });
}));

router.post("/members",
  requireRole("admin", "owner"),
  validateBody(createMemberSchema),
  catchAsync(async (req, res) => {
    const member = await OrgMember.create(req.body);
    res.status(201).json({ success: true, member });
  })
);

router.put("/members/:id",
  requireRole("admin", "owner"),
  validateBody(updateMemberSchema),
  catchAsync(async (req, res) => {
    const member = await OrgMember.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!member) throw new NotFoundError("Member");
    res.json({ success: true, member });
  })
);

router.delete("/members/:id",
  requireRole("admin", "owner"),
  catchAsync(async (req, res) => {
    const member = await OrgMember.findByIdAndDelete(req.params.id).lean();
    if (!member) throw new NotFoundError("Member");
    res.json({ success: true });
  })
);

// ── Org Invitations ───────────────────────────────────────────

router.get("/invitations", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = {};
  if (oid) filter.organizationId = oid;
  res.json({ success: true, invitations: await OrgInvitation.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/invitations/:id", catchAsync(async (req, res) => {
  const inv = await OrgInvitation.findById(req.params.id).lean();
  if (!inv) throw new NotFoundError("Invitation");
  res.json({ success: true, invitation: inv });
}));

router.post("/invitations",
  requireRole("admin", "owner"),
  validateBody(createInvitationSchema),
  catchAsync(async (req, res) => {
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
    res.status(201).json({ success: true, invitation: inv });
  })
);

router.put("/invitations/:id",
  requireRole("admin", "owner"),
  catchAsync(async (req, res) => {
    const inv = await OrgInvitation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!inv) throw new NotFoundError("Invitation");
    res.json({ success: true, invitation: inv });
  })
);

router.delete("/invitations/:id",
  requireRole("admin", "owner"),
  catchAsync(async (req, res) => {
    const inv = await OrgInvitation.findByIdAndDelete(req.params.id).lean();
    if (!inv) throw new NotFoundError("Invitation");
    res.json({ success: true });
  })
);

// ── Master Data ───────────────────────────────────────────────

router.get("/master-data", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (oid) filter.organizationId = oid;
  res.json({ success: true, masterData: await MasterData.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/master-data/:id", catchAsync(async (req, res) => {
  const item = await MasterData.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!item) throw new NotFoundError("MasterData");
  res.json({ success: true, masterData: item });
}));

router.post("/master-data",
  requireRole("admin", "owner"),
  validateBody(createMasterDataSchema),
  catchAsync(async (req, res) => {
    const oid = await orgId((req as AuthRequest).user!.userId);
    const item = await MasterData.create({ ...req.body, organizationId: oid ?? "" });
    res.status(201).json({ success: true, masterData: item });
  })
);

router.put("/master-data/:id",
  requireRole("admin", "owner"),
  validateBody(updateMasterDataSchema),
  catchAsync(async (req, res) => {
    const item = await MasterData.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!item) throw new NotFoundError("MasterData");
    res.json({ success: true, masterData: item });
  })
);

router.delete("/master-data/:id",
  requireRole("admin", "owner"),
  catchAsync(async (req, res) => {
    const item = await MasterData.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: { deletedAt: new Date().toISOString() } }, { new: true }).lean();
    if (!item) throw new NotFoundError("MasterData");
    res.json({ success: true });
  })
);

export default router;
