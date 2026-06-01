import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { OrgInvitation, OrgMember } from "../models/index.js";
import { sendInviteEmail } from "../email/resend.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { ConflictError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import { createInvitationSchema } from "../validators/entity.js";

const router = Router();
router.use(authenticate);

router.post("/send",
  requireRole("admin", "owner"),
  validateBody(createInvitationSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const member = await OrgMember.findOne({ userId: authReq.user!.userId }).lean() as any;
    if (!member?.organizationId) {
      throw new ConflictError("You are not a member of an organization");
    }

    const email = req.body.email.toLowerCase().trim();

    // Check for existing pending invitation
    const existing = await OrgInvitation.findOne({
      email,
      organizationId: member.organizationId,
      status: "pending",
      expiresAt: { $gt: new Date().toISOString() },
    }).lean();

    if (existing) {
      throw new ConflictError("Pending invitation already exists for this email");
    }

    const inviteToken = crypto.randomUUID();

    await OrgInvitation.create({
      _id: inviteToken,
      organizationId: member.organizationId,
      email,
      role: req.body.role || "member",
      invitedBy: authReq.user!.userId,
      token: inviteToken,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    sendInviteEmail({
      to: email,
      inviteToken,
      organizationName: "", // Will be populated by email template
      inviterName: authReq.user!.email || "Your team",
      role: req.body.role || "member",
    }).catch((err: Error) => {
      console.error("[Invite] Email failed:", err.message);
    });

    res.json({ success: true });
  })
);

export default router;
