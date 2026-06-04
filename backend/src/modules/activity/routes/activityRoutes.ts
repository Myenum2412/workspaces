// @ts-nocheck
import { Router } from "express";
import { activityController } from "../controllers/activityController.js";
import { validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), userId: z.string().uuid().optional(), entityType: z.string().max(100).optional(), action: z.string().max(255).optional(), fromDate: z.string().optional(), toDate: z.string().optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), activityController.list);
router.get("/audit-logs", requireRole("ORG_ADMIN"), validateQuery(listSchema), activityController.auditLogs);

export default router;
