import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { Team, OrgMember } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { createTeamSchema, updateTeamSchema } from "../validators/entity.js";

const router = Router();
router.use(authenticate);

async function orgId(userId: string): Promise<string | null> {
  const m = await OrgMember.findOne({ userId }).lean() as any;
  return m?.organizationId ?? null;
}

router.get("/", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (oid) filter.organizationId = oid;
  res.json({ success: true, teams: await Team.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/:id", catchAsync(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!team) throw new NotFoundError("Team");
  res.json({ success: true, team });
}));

router.post("/",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(createTeamSchema),
  catchAsync(async (req, res) => {
    const oid = await orgId((req as AuthRequest).user!.userId);
    const team = await Team.create({ ...req.body, organizationId: oid ?? "" });
    res.status(201).json({ success: true, team });
  })
);

router.put("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(updateTeamSchema),
  catchAsync(async (req, res) => {
    const team = await Team.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!team) throw new NotFoundError("Team");
    res.json({ success: true, team });
  })
);

router.delete("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const team = await Team.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: { deletedAt: new Date().toISOString() } }, { new: true }).lean();
    if (!team) throw new NotFoundError("Team");
    res.json({ success: true });
  })
);

export default router;
