import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Branch, OrgMember } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";

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
  res.json({ success: true, branches: await Branch.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/:id", catchAsync(async (req, res) => {
  const branch = await Branch.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!branch) throw new NotFoundError("Branch");
  res.json({ success: true, branch });
}));

router.post("/", catchAsync(async (req, res) => {
  const oid = await orgId((req as AuthRequest).user!.userId);
  const branch = await Branch.create({ ...req.body, organizationId: oid ?? "" });
  res.status(201).json({ success: true, branch });
}));

router.put("/:id", catchAsync(async (req, res) => {
  const branch = await Branch.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: req.body }, { new: true, runValidators: true }).lean();
  if (!branch) throw new NotFoundError("Branch");
  res.json({ success: true, branch });
}));

router.delete("/:id", catchAsync(async (req, res) => {
  const branch = await Branch.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: { deletedAt: new Date().toISOString() } }, { new: true }).lean();
  if (!branch) throw new NotFoundError("Branch");
  res.json({ success: true });
}));

export default router;
