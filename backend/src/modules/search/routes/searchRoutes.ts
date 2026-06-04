// @ts-nocheck
import { Router } from "express";
import { searchController } from "../controllers/searchController.js";
import { authenticate } from "../../../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", searchController.global);

export default router;
