import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { connectDB } from "../config/connection.js";
import { OrgInvitation, Organization } from "../models/index.js";
import { sendInviteEmail } from "../email/resend.js";

const router = Router();
router.use(authenticate);

router.post("/send", async (req: Request, res: Response) => {
  try {
    const { email, inviteToken, organizationName, inviterName, role } = req.body;

    if (!email || !inviteToken || !organizationName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const authReq = req as AuthRequest;
    await connectDB();

    // Find organization by name or by user's org
    let orgId: string | undefined;
    const org = await Organization.findOne({
      $or: [
        { name: organizationName },
        { _id: authReq.user!.organizationId },
      ],
    }).lean() as any;

    if (org) {
      orgId = org._id.toString();
    } else {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Create invitation document in DB
    await OrgInvitation.create({
      _id: inviteToken,
      organizationId: orgId,
      email: email.toLowerCase().trim(),
      role: role ?? "member",
      invitedBy: authReq.user!.userId,
      token: inviteToken,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await sendInviteEmail({
      to: email,
      inviteToken,
      organizationName,
      inviterName: inviterName ?? "Your team",
      role: role ?? "member",
    }).catch((err) => {
      console.error("Invite email failed:", err);
    });

    res.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Failed to send invite";
    console.error("Invite error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
