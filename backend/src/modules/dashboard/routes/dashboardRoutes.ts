import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticate } from "../../../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/stats", dashboardController.stats);
router.get("/my-tasks", dashboardController.myTasks);

export default router;
