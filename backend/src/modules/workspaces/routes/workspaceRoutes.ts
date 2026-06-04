import { Router } from "express";
import { workspaceController } from "../controllers/workspaceController.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1).max(255), description: z.string().max(1000).optional() });
const updateSchema = z.object({ name: z.string().min(1).max(255).optional(), description: z.string().max(1000).optional(), status: z.enum(["active", "archived"]).optional() });
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(200).optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), workspaceController.list);
router.get("/:id", workspaceController.getById);
router.post("/", requireRole("ORG_ADMIN"), validateBody(createSchema), workspaceController.create);
router.patch("/:id", requireRole("ORG_ADMIN"), validateBody(updateSchema), workspaceController.update);
router.delete("/:id", requireRole("ORG_ADMIN"), workspaceController.remove);

export default router;
