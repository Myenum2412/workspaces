import { Router } from "express";
import { projectController } from "../controllers/projectController.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1).max(255), description: z.string().max(2000).optional(), status: z.enum(["planning", "active", "on_hold", "completed", "archived"]).optional(), startDate: z.string().optional(), endDate: z.string().optional() });
const updateSchema = z.object({ name: z.string().min(1).max(255).optional(), description: z.string().max(2000).optional(), status: z.enum(["planning", "active", "on_hold", "completed", "archived"]).optional(), startDate: z.string().nullable().optional(), endDate: z.string().nullable().optional() });
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(200).optional(), status: z.string().max(50).optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), projectController.list);
router.get("/:id", projectController.getById);
router.post("/", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(createSchema), projectController.create);
router.patch("/:id", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(updateSchema), projectController.update);
router.delete("/:id", requireRole("ORG_ADMIN"), projectController.delete);

export default router;
