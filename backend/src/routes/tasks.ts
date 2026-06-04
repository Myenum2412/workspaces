import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { Task, SavedTask, OrgMember } from "../models/index.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema, createSavedTaskSchema, updateSavedTaskSchema } from "../validators/entity.js";

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

// ── Stats Endpoint ─────────────────────────────────────────────

router.get("/stats", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;

  const today = new Date().toISOString().slice(0, 10);

  const [todayCount, inProgress, pending, onHold, overdue, total] = await Promise.all([
    Task.countDocuments({ ...filter, dueDate: today }),
    Task.countDocuments({ ...filter, status: "in_progress" }),
    Task.countDocuments({ ...filter, status: "pending" }),
    Task.countDocuments({ ...filter, status: "on_hold" }),
    Task.countDocuments({
      ...filter,
      dueDate: { $lt: today },
      status: { $nin: ["completed", "rejected", "on_hold"] },
    }),
    Task.countDocuments(filter),
  ]);

  apiResponse.success(res, {
    todayTask: todayCount,
    inProgressTask: inProgress,
    pendingTask: pending,
    postponedTask: onHold,
    overdueTask: overdue,
    totalTask: total,
    teamTask: 0, // placeholder for team-assigned count
  });
}));

// ── Tasks CRUD (Paginated) ─────────────────────────────────────

router.get("/", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo as string;
  if (req.query.status) filter.status = req.query.status as string;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Task.countDocuments(filter),
  ]);

  apiResponse.paginated(res, tasks, total, page, limit, (req as any).requestId);
}));

router.get("/saved", catchAsync(async (req: Request, res: Response) => {
  const orgId = await getUserOrgId((req as AuthRequest).user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;

  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [savedTasks, total] = await Promise.all([
    SavedTask.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SavedTask.countDocuments(filter),
  ]);

  apiResponse.paginated(res, savedTasks, total, page, limit, (req as any).requestId);
}));

router.get("/:id", catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!task) throw new NotFoundError("Task");
  apiResponse.success(res, { task }, 200, (req as any).requestId);
}));

router.post("/",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(createTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const orgId = await getUserOrgId((req as AuthRequest).user!.userId) ?? "";
    const task = await Task.create({
      ...req.body,
      _id: req.body._id || crypto.randomUUID(),
      organizationId: orgId,
    });
    apiResponse.created(res, { task }, (req as any).requestId);
  })
);

router.put("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"),
  validateBody(updateTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!task) throw new NotFoundError("Task");
    apiResponse.success(res, { task }, 200, (req as any).requestId);
  })
);

router.delete("/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req: Request, res: Response) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!task) throw new NotFoundError("Task");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

// ── Saved Tasks ────────────────────────────────────────────────

router.post("/saved",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(createSavedTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const orgId = await getUserOrgId((req as AuthRequest).user!.userId) ?? "";
    const savedTask = await SavedTask.create({
      ...req.body,
      _id: req.body._id || crypto.randomUUID(),
      organizationId: orgId,
    });
    apiResponse.created(res, { savedTask }, (req as any).requestId);
  })
);

router.put("/saved/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  validateBody(updateSavedTaskSchema),
  catchAsync(async (req: Request, res: Response) => {
    const savedTask = await SavedTask.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!savedTask) throw new NotFoundError("SavedTask");
    apiResponse.success(res, { savedTask }, 200, (req as any).requestId);
  })
);

router.delete("/saved/:id",
  requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"),
  catchAsync(async (req: Request, res: Response) => {
    const savedTask = await SavedTask.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    if (!savedTask) throw new NotFoundError("SavedTask");
    apiResponse.success(res, { success: true }, 200, (req as any).requestId);
  })
);

export default router;
