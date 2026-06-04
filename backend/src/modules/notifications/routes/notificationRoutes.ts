import { Router } from "express";
import { notificationController } from "../controllers/notificationController.js";
import { authenticate } from "../../../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);
router.patch("/read-all", notificationController.markAllRead);
router.delete("/:id", notificationController.delete);

export default router;
