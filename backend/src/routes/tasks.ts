import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Task, SavedTask } from "../models/index.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError, AuthorizationError } from "../core/errors/AppError.js";

const router = Router();
router.use(authenticate);

/** Get user's organizationId from membership */
async function getUserOrgId(userId: string): Promise<string | null> {
  const { OrgMember } = await import("../models/index.js");
  const member = await OrgMember.findOne({ userId }).lean() as any;
  return member?.organizationId ?? null;
}

// ── Tasks CRUD ─────────────────────────────────────────────────

router.get("/", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = await getUserOrgId(authReq.user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo as string;
  if (req.query.status) filter.status = req.query.status as string;
  if (req.query.organizationId) filter.organizationId = req.query.organizationId as string;
  const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
  apiResponse.success(res, { tasks });
}));

router.get("/saved", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = await getUserOrgId(authReq.user!.userId);
  const filter: any = { deletedAt: null };
  if (orgId) filter.organizationId = orgId;
  if (req.query.organizationId) filter.organizationId = req.query.organizationId as string;
  const savedTasks = await SavedTask.find(filter).sort({ createdAt: -1 }).lean();
  apiResponse.success(res, { savedTasks });
}));

router.get("/:id", catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!task) throw new NotFoundError("Task");
  apiResponse.success(res, { task });
}));

router.post("/", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orgId = await getUserOrgId(authReq.user!.userId) ?? req.body.organizationId ?? "";
  const task = await Task.create({ ...req.body, organizationId: orgId });
  apiResponse.created(res, { task });
}));

router.put("/:id", catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();
  if (!task) throw new NotFoundError("Task");
  apiResponse.success(res, { task });
}));

router.delete("/:id", catchAsync(async (req: Request, res: Response) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, deletedAt: null },
    { $set: { deletedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
  if (!task) throw new NotFoundError("Task");
  apiResponse.success(res, { success: true });
}));

export default router;
