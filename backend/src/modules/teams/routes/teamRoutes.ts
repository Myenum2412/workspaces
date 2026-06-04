import { Router } from "express";
import { teamController } from "../controllers/teamController.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1).max(255), description: z.string().max(1000).optional(), headUserId: z.string().uuid().optional() });
const updateSchema = z.object({ name: z.string().min(1).max(255).optional(), description: z.string().max(1000).optional(), headUserId: z.string().uuid().nullable().optional(), status: z.string().max(50).optional() });
const listSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), search: z.string().max(200).optional(), sortBy: z.string().max(50).default("createdAt"), sortOrder: z.enum(["asc", "desc"]).default("desc") });
const addMemberSchema = z.object({ userId: z.string().uuid(), role: z.enum(["LEADER", "MEMBER"]).default("MEMBER") });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listSchema), teamController.list);
router.get("/:id", teamController.getById);
router.post("/", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(createSchema), teamController.create);
router.patch("/:id", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(updateSchema), teamController.update);
router.delete("/:id", requireRole("ORG_ADMIN"), teamController.delete);
router.post("/:id/members", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(addMemberSchema), teamController.addMember);
router.delete("/:id/members/:userId", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), teamController.removeMember);

export default router;
