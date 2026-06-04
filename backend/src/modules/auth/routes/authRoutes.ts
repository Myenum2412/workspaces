import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { validateBody } from "../../../middleware/validate.js";
import { authenticate } from "../../../middleware/auth.js";
import { authLimiter } from "../../../middleware/rateLimiter.js";
import {
  registerSchema, loginSchema, changePasswordSchema,
  forgotPasswordSchema, resetPasswordSchema, verify2FASchema, disable2FASchema,
} from "../validators/authSchema.js";

const router = Router();

router.post("/register", authLimiter, validateBody(registerSchema), authController.register);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/change-password", authenticate, validateBody(changePasswordSchema), authController.changePassword);
router.post("/forgot-password", authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.post("/2fa/setup", authenticate, authController.setup2FA);
router.post("/2fa/verify", authenticate, validateBody(verify2FASchema), authController.verify2FA);
router.post("/2fa/disable", authenticate, validateBody(disable2FASchema), authController.disable2FA);
router.get("/csrf-token", authController.csrfToken);

export default router;
