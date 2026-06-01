import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { Task, SavedTask, OrgMember } from "../models/index.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, createSavedTaskSchema, updateSavedTaskSchema } from "../validators/entity.js";

const router = Router();
router.use(authenticate);

async function getUserOrgId(userId: string): Promise<string | null> {
  const member = await OrgMember.findOne({ userId }).lean() as any;
  return member?.organizationId ?? null;
}

// ── Tasks CRUD ─────────────────────────────────────────────────

router.get("/", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo as string;
  if (req.query.status) filter.status = req.query.status as string;
  const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
  apiResponse.success(res, { tasks });
}));

router.get("/saved", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;
  const savedTasks = await SavedTask.find(filter).sort({ createdAt: -1 }).lean();
  apiResponse.success(res, { savedTasks });
}));

router.get("/:id", catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!task) throw new NotFoundError("Task");
  apiResponse.success(res, { task });
}));

router.post("/",
  requireRole("admin", "owner", "operator", "member"),
  validateBody(createTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const orgId = await getUserOrgId((req as AuthRequest).user!.userId) ?? "";
    const task = await Task.create({ ...req.body, _id: req.body._id || crypto.randomUUID(), organizationId: orgId });
    apiResponse.created(res, { task });
  })
);

router.put("/:id",
  requireRole("admin", "owner", "operator", "member"),
  validateBody(updateTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!task) throw new NotFoundError("Task");
    apiResponse.success(res, { task });
  })
);

router.delete("/:id",
  requireRole("admin", "owner", "operator"),
  catchAsync(async (req: Request, res: Response) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!task) throw new NotFoundError("Task");
    apiResponse.success(res, { success: true });
  })
);

// ── Saved Tasks ────────────────────────────────────────────────

router.post("/saved",
  requireRole("admin", "owner", "operator"),
  validateBody(createSavedTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const orgId = await getUserOrgId((req as AuthRequest).user!.userId) ?? "";
    const savedTask = await SavedTask.create({ ...req.body, _id: req.body._id || crypto.randomUUID(), organizationId: orgId });
    apiResponse.created(res, { savedTask });
  })
);

router.put("/saved/:id",
  requireRole("admin", "owner", "operator"),
  validateBody(updateSavedTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const savedTask = await SavedTask.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!savedTask) throw new NotFoundError("SavedTask");
    apiResponse.success(res, { savedTask });
  })
);

router.delete("/saved/:id",
  requireRole("admin", "owner", "operator"),
  catchAsync(async (req: Request, res: Response) => {
    const savedTask = await SavedTask.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!savedTask) throw new NotFoundError("SavedTask");
    apiResponse.success(res, { success: true });
  })
);

export default router;
