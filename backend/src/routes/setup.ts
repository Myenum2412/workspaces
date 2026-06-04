import { Router, Request, Response } from "express";
import { env } from "../config/env.js";
import { isSuperAdmin } from "../config/env.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

// Only super-admins can access setup endpoints
router.use(authenticate);
router.use(requireRole("ORG_ADMIN"));

// Verify super-admin email as additional guard
function requireSuperAdmin(req: Request, res: Response, next: Function) {
  const authReq = req as AuthRequest;
  if (!authReq.user?.email || !isSuperAdmin(authReq.user.email)) {
    return res.status(403).json({ error: "Super-admin access required" });
  }
  next();
}

router.get("/", requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const { connectDB } = await import("../config/connection.js");
    await connectDB();
    res.json({ success: true, message: "Database connected", environment: env.NODE_ENV });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Database connection failed" });
  }
});

export default router;
