import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { Organization, OrgMember } from "../models/index.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { NotFoundError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { hrSettingsSchema, themeSettingsSchema, createShiftSchema, updateShiftSchema } from "../validators/entity.js";
import crypto from "crypto";

const router = Router();
router.use(authenticate);

async function getUserOrg(userId: string) {
  const member = await OrgMember.findOne({ userId }).lean() as any;
  if (!member) return null;
  return await Organization.findById(member.organizationId);
}

router.get("/hr-settings", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const org = await getUserOrg(authReq.user!.userId);
  if (!org) throw new NotFoundError("Organization");
  res.json({ success: true, hrSettings: org.hrSettings || {} });
}));

router.put("/hr-settings",
  validateBody(hrSettingsSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    if (!member) throw new NotFoundError("Organization");
    const org = await Organization.findByIdAndUpdate(
      member.organizationId,
      { $set: { hrSettings: req.body } },
      { new: true }
    );
    res.json({ success: true, hrSettings: org?.hrSettings || {} });
  })
);

router.get("/theme-settings", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const org = await getUserOrg(authReq.user!.userId);
  if (!org) throw new NotFoundError("Organization");
  res.json({ success: true, themeSettings: org.themeSettings || {} });
}));

import { getIO } from "../ws/server.js";

router.put("/theme-settings",
  validateBody(themeSettingsSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;
    if (actor.role !== "admin" && actor.role !== "owner") {
      return res.status(403).json({ error: "Admin access required" });
    }
    const member = await OrgMember.findOne({ userId: actor.userId }).lean() as any;
    if (!member) throw new NotFoundError("Organization");
    const org = await Organization.findByIdAndUpdate(
      member.organizationId,
      { $set: { themeSettings: req.body } },
      { new: true }
    );
    const io = getIO();
    if (io) {
      io.to(`org:${member.organizationId}`).emit("branding_updated", org?.themeSettings);
    }
    res.json({ success: true, themeSettings: org?.themeSettings || {} });
  })
);

router.get("/shifts", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const org = await getUserOrg(authReq.user!.userId);
  if (!org) throw new NotFoundError("Organization");
  res.json({ success: true, shifts: org.hrSettings?.shifts || [] });
}));

router.post("/shifts",
  validateBody(createShiftSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) throw new NotFoundError("Organization");
    const newShift = { ...req.body, id: crypto.randomUUID() };
    const shifts = org.hrSettings?.shifts || [];
    shifts.push(newShift);
    await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
    res.json({ success: true, shift: newShift });
  })
);

router.put("/shifts/:id",
  validateBody(updateShiftSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const org = await getUserOrg(authReq.user!.userId);
    if (!org) throw new NotFoundError("Organization");
    const shifts = org.hrSettings?.shifts || [];
    const index = shifts.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) throw new NotFoundError("Shift");
    shifts[index] = { ...shifts[index], ...req.body };
    await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
    res.json({ success: true, shift: shifts[index] });
  })
);

router.delete("/shifts/:id", catchAsync(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const org = await getUserOrg(authReq.user!.userId);
  if (!org) throw new NotFoundError("Organization");
  const shifts = (org.hrSettings?.shifts || []).filter((s: any) => s.id !== req.params.id);
  await Organization.findByIdAndUpdate(org._id, { $set: { "hrSettings.shifts": shifts } });
  res.json({ success: true });
}));

export default router;
