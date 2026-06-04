import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { Client, OrgMember } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { createClientSchema, updateClientSchema } from "../validators/entity.js";

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
  res.json({ success: true, clients: await Client.find(filter).sort({ createdAt: -1 }).lean() });
}));

router.get("/:id", catchAsync(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!client) throw new NotFoundError("Client");
  res.json({ success: true, client });
}));

router.post("/",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(createClientSchema),
  catchAsync(async (req, res) => {
    const oid = await orgId((req as AuthRequest).user!.userId);
    const client = await Client.create({ ...req.body, organizationId: oid ?? "" });
    res.status(201).json({ success: true, client });
  })
);

router.put("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(updateClientSchema),
  catchAsync(async (req, res) => {
    const client = await Client.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!client) throw new NotFoundError("Client");
    res.json({ success: true, client });
  })
);

router.delete("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req, res) => {
    const client = await Client.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { $set: { deletedAt: new Date().toISOString() } }, { new: true }).lean();
    if (!client) throw new NotFoundError("Client");
    res.json({ success: true });
  })
);

export default router;
