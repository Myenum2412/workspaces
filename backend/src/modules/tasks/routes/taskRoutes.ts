import { Router } from "express";
import { taskController } from "../controllers/taskController.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const createSchema = z.object({ title: z.string().min(1).max(500), description: z.string().max(5000).optional(), assignedTo: z.string().uuid().nullable().optional(), assignedType: z.enum(["member", "team"]).default("member"), projectId: z.string().uuid().nullable().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"), startDate: z.string().nullable().optional(), dueDate: z.string().nullable().optional(), tags: z.array(z.string()).optional() });
const updateSchema = z.object({ title: z.string().min(1).max(500).optional(), description: z.string().max(5000).optional(), assignedTo: z.string().uuid().nullable().optional(), assignedType: z.enum(["member", "team"]).optional(), status: z.enum(["pending", "assigned", "in_progress", "under_review", "completed", "rejected", "on_hold"]).optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional(), startDate: z.string().nullable().optional(), dueDate: z.string().nullable().optional(), completedAt: z.string().nullable().optional(), reviewedBy: z.string().uuid().nullable().optional(), reviewNotes: z.string().max(2000).optional(), tags: z.array(z.string()).optional() });
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(200).optional(), status: z.string().max(50).optional(), priority: z.string().max(50).optional(), assignedTo: z.string().uuid().optional(), projectId: z.string().uuid().optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), taskController.list);
router.get("/:id", taskController.getById);
router.post("/", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(createSchema), taskController.create);
router.patch("/:id", validateBody(updateSchema), taskController.update);
router.delete("/:id", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), taskController.delete);

export default router;
