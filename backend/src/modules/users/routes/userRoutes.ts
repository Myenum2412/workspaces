// @ts-nocheck
import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { validateBody, validateQuery } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { createUserSchema, updateUserSchema, updateRoleSchema, listUsersSchema, bulkActionSchema } from "../validators/userSchema.js";

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(listUsersSchema), userController.list);
router.get("/:id", userController.getById);
router.post("/", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), validateBody(createUserSchema), userController.create);
router.patch("/:id", validateBody(updateUserSchema), userController.update);
router.patch("/:id/role", requireRole("ORG_ADMIN"), validateBody(updateRoleSchema), userController.updateRole);
router.delete("/:id", requireRole("ORG_ADMIN", "WORKSPACE_MANAGER"), userController.delete);
router.post("/bulk", requireRole("ORG_ADMIN"), validateBody(bulkActionSchema), userController.bulkAction);

export default router;
