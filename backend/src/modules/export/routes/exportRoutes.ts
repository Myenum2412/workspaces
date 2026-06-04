import { Router } from "express";
import { exportController } from "../controllers/exportController.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/tasks", exportController.tasks);
router.get("/projects", exportController.projects);
router.get("/users", requireRole("ORG_ADMIN"), exportController.users);

export default router;
