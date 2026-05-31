import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Organization, OrgMember } from "../models/index.js";
import crypto from "crypto";

const router = Router();

router.use(authenticate);

// Helper to get user's organization
async function getUserOrg(userId: string) {
  const member = await OrgMember.findOne({ userId }).lean() as any;
  if (!member) return null;
  return await Organization.findById(member.organizationId);
}

// GET /api/workspace/hr-settings
router.get("/hr-settings", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    res.json({ success: true, hrSettings: org.hrSettings || {} });
  } catch (error: any) {
    console.error("[Workspace] GET hr-settings error:", error);
    res.status(500).json({ error: "Failed to fetch HR settings" });
  }
});

// PUT /api/workspace/hr-settings
router.put("/hr-settings", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    
    // Check if admin or owner
    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    if (!member) return res.status(404).json({ error: "Organization not found" });

    const org = await Organization.findByIdAndUpdate(
      member.organizationId,
      { $set: { hrSettings: req.body } },
      { new: true }
    );

    res.json({ success: true, hrSettings: org?.hrSettings || {} });
  } catch (error: any) {
    console.error("[Workspace] PUT hr-settings error:", error);
    res.status(500).json({ error: "Failed to update HR settings" });
  }
});

// GET /api/workspace/theme-settings
router.get("/theme-settings", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    res.json({ success: true, themeSettings: org.themeSettings || {} });
  } catch (error: any) {
    console.error("[Workspace] GET theme-settings error:", error);
    res.status(500).json({ error: "Failed to fetch theme settings" });
  }
});

// PUT /api/workspace/theme-settings
router.put("/theme-settings", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    
    // Check if admin or owner
    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    if (!member) return res.status(404).json({ error: "Organization not found" });

    const org = await Organization.findByIdAndUpdate(
      member.organizationId,
      { $set: { themeSettings: req.body } },
      { new: true }
    );

    res.json({ success: true, themeSettings: org?.themeSettings || {} });
  } catch (error: any) {
    console.error("[Workspace] PUT theme-settings error:", error);
    res.status(500).json({ error: "Failed to update theme settings" });
  }
});

// GET /api/workspace/shifts
router.get("/shifts", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    res.json({ success: true, shifts: org.hrSettings?.shifts || [] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch shifts" });
  }
});

// POST /api/workspace/shifts
router.post("/shifts", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const newShift = { ...req.body, id: crypto.randomUUID() };
    const shifts = org.hrSettings?.shifts || [];
    shifts.push(newShift);

    await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
    res.json({ success: true, shift: newShift });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create shift" });
  }
});

// PUT /api/workspace/shifts/:id
router.put("/shifts/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const shifts = org.hrSettings?.shifts || [];
    const index = shifts.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Shift not found" });

    shifts[index] = { ...shifts[index], ...req.body };
    await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
    res.json({ success: true, shift: shifts[index] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update shift" });
  }
});

// DELETE /api/workspace/shifts/:id
router.delete("/shifts/:id", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) return res.status(404).json({ error: "Organization not found" });

    const shifts = (org.hrSettings?.shifts || []).filter((s: any) => s.id !== req.params.id);
    await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete shift" });
  }
});

export default router;
