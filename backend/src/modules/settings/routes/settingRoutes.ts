import { Router } from "express";
import { settingController } from "../controllers/settingController.js";
import { validateBody } from "../../../middleware/validate.js";
import { authenticate, requireRole } from "../../../middleware/auth.js";
import { z } from "zod";

const upsertSchema = z.object({ key: z.string().min(1).max(255), value: z.any() });
const brandingSchema = z.object({ colors: z.record(z.string()).optional(), darkModeColors: z.record(z.string()).optional(), typography: z.record(z.string()).optional(), logo: z.record(z.string()).optional(), favicon: z.string().max(500).optional(), mode: z.enum(["light", "dark", "system"]).optional(), presetName: z.string().max(100).optional() });

const router = Router();
router.use(authenticate);

router.get("/", settingController.list);
router.get("/:key", settingController.get);
router.post("/", requireRole("ORG_ADMIN"), validateBody(upsertSchema), settingController.upsert);
router.delete("/:key", requireRole("ORG_ADMIN"), settingController.delete);
router.get("/branding", settingController.getBranding);
router.put("/branding", requireRole("ORG_ADMIN"), validateBody(brandingSchema), settingController.updateBranding);

export default router;
