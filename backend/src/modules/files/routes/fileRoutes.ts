// @ts-nocheck
import { Router } from "express";
import { fileController, uploadSingle } from "../controllers/fileController.js";
import { validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { uploadLimiter } from "../../../middleware/rateLimiter.js";
import { z } from "zod";

const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), folder: z.string().max(255).optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), fileController.list);
router.post("/", uploadLimiter, requireRole("ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"), uploadSingle, fileController.upload);
router.delete("/:id", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), fileController.delete);

export default router;
