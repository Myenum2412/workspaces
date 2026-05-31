import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { connectDB } from "../config/connection.js";
import {
  UserProfile,
  Organization,
  OrgMember,
} from "../models/index.js";
import { authenticate, signToken, AuthRequest } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validators/auth.js";
import { sendForgotPasswordEmail, sendSignupWelcomeEmail, sendVerificationEmail } from "../email/resend.js";
import { getIO } from "../ws/server.js";

const router = Router();

// ── Passport Google OAuth ─────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      await connectDB();
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("No email from Google"));
      let user = await UserProfile.findOne({ email }).lean() as any;
      if (!user) {
        const userId = crypto.randomUUID();
        const orgId = crypto.randomUUID();
        const displayName = profile.displayName ?? "";
        const firstName = profile.name?.givenName ?? displayName.split(" ")[0] ?? "User";
        const lastName = profile.name?.familyName ?? displayName.split(" ").slice(1).join(" ") ?? "";
        await Organization.create({ _id: orgId, name: `${firstName}'s Organization` });
        await UserProfile.create({ _id: userId, userId, email, firstName, lastName, organizationId: orgId, designation: "workspace" });
        await OrgMember.create({ _id: crypto.randomUUID(), organizationId: orgId, userId, role: "owner", status: "active", joinedAt: new Date().toISOString() });
        user = await UserProfile.findOne({ email }).lean() as any;
      }
      return done(null, user);
    } catch (err) {
      return done(err as Error);
    }
  }));
}

// ── Google OAuth routes ───────────────────────────────────────
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), (req: Request, res: Response) => {
  const user = req.user as any;
  const token = signToken({ userId: user._id.toString(), email: user.email, organizationId: user.organizationId ?? "", role: "owner" });
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
});

// ── LinkedIn OAuth routes (placeholder) ───────────────────────
router.get("/linkedin", (_req: Request, res: Response) => {
  res.status(501).json({ error: "LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars." });
});

router.post("/register", validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, companyName, email, category, companyRange } = req.body;

    await connectDB();

    const existing = await UserProfile.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();

    await Organization.create({
      _id: orgId,
      name: companyName,
      category: category || "Other",
      companyRange: companyRange || "1-10",
    });

    await UserProfile.create({
      _id: userId,
      userId,
      email,
      firstName,
      lastName,
      passwordHash,
      organizationId: orgId,
      designation: "workspace",
    });

    await OrgMember.create({
      _id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      role: "owner",
      status: "active",
      joinedAt: new Date().toISOString(),
    });

    const token = signToken({
      userId,
      email,
      organizationId: orgId,
      role: "owner",
    });

    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    await sendSignupWelcomeEmail({
      to: email,
      name: `${firstName} ${lastName}`.trim(),
      password: tempPassword,
      verifyUrl: loginUrl,
    }).catch((err) => {
      console.error("[Signup] Welcome email failed:", err);
    });

    res.status(201).json({
      success: true,
      token,
      password: tempPassword,
      user: { $id: userId, email, name: `${firstName} ${lastName}`, firstName, lastName },
      organization: { $id: orgId, name: companyName },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message || "Registration failed" });
  }
});

router.post("/login", validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    await connectDB();

    const profile = await UserProfile.findOne({ email }).lean() as any;
    if (!profile) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, profile.passwordHash ?? "");
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const member = await OrgMember.findOne({ userId: profile._id.toString() }).lean() as any;
    const userId = profile._id.toString();

    // Update login info + activity log (non-blocking)
    const { ProfileService } = await import("../services/profile.js");
    ProfileService.updateLoginInfo(userId, req).catch(() => {});
    ProfileService.logActivity({ userId, action: "user_login", req }).catch(() => {});

    const token = signToken({
      userId,
      email: profile.email,
      organizationId: member?.organizationId ?? profile.organizationId ?? "",
      role: member?.role ?? "member",
    });

    res.json({
      success: true,
      token,
      user: {
        $id: userId,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
        avatarUrl: profile.avatarUrl,
        emailVerified: profile.emailVerified,
        role: member?.role ?? "member",
        organizationId: member?.organizationId ?? profile.organizationId ?? "",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const profile = await UserProfile.findById(authReq.user!.userId).lean() as any;
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    const member = await OrgMember.findOne({ userId: authReq.user!.userId }).lean() as any;
    let organization = null;
    if (member) {
      organization = await Organization.findById(member.organizationId).lean() as any;
    }

    res.json({
      user: {
        $id: profile._id.toString(),
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
      },
      organization: organization
        ? { $id: organization._id.toString(), name: organization.name }
        : null,
      membership: member
        ? { role: member.role, organizationId: member.organizationId }
        : null,
    });
  } catch (error: any) {
    console.error("Me error:", error);
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

router.post("/change-password", authenticate, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    await connectDB();
    const profile = await UserProfile.findById(authReq.user!.userId);
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, profile.passwordHash ?? "");
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    profile.passwordHash = await bcrypt.hash(newPassword, 12);
    await profile.save();

    res.json({ success: true });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ error: error.message || "Failed to change password" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }
    profile.emailVerified = true;
    profile.verifiedAt = new Date();
    await profile.save();
    
    // Emit real-time verification update
    const io = getIO();
    if (io) {
      io.emit("verification_update", {
        email: profile.email,
        emailVerified: profile.emailVerified,
        verifiedAt: profile.verifiedAt
      });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Verification failed" });
  }
});

router.post("/verifications", async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: "Invalid emails array" });
    }
    await connectDB();
    const profiles = await UserProfile.find({ email: { $in: emails } }).select("email emailVerified verifiedAt").lean();
    const verifications = profiles.reduce((acc: any, curr: any) => {
      acc[curr.email] = {
        emailVerified: curr.emailVerified,
        verifiedAt: curr.verifiedAt
      };
      return acc;
    }, {});
    res.json({ verifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch verifications" });
  }
});

router.post("/statuses", async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: "Invalid userIds array" });
    }
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    const statuses = await UserStatus.find({ userId: { $in: userIds } }).select("userId status lastActiveAt").lean();

    // Get currently-online user IDs from socket map
    const { getOnlineUserIds } = await import("../ws/server.js");
    const onlineIds = getOnlineUserIds();

    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = new Date().getTime();

    const result = statuses.reduce((acc: any, curr: any) => {
      // If user has active socket connection, always show Online
      if (onlineIds.has(curr.userId)) {
        acc[curr.userId] = "Online";
        return acc;
      }
      let finalStatus = curr.status;
      if (curr.lastActiveAt) {
        const timeDiff = now - new Date(curr.lastActiveAt).getTime();
        if (timeDiff > TWELVE_HOURS) {
          finalStatus = "Leave";
        }
      }
      acc[curr.userId] = finalStatus;
      return acc;
    }, {});
    res.json({ statuses: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch statuses" });
  }
});

router.get("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    const record = await UserStatus.findOne({ userId: authReq.user!.userId }).lean() as any;
    res.json({ status: record?.status ?? "Offline", lastActiveAt: record?.lastActiveAt ?? null });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch status" });
  }
});

router.post("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    await UserStatus.findOneAndUpdate(
      { userId: authReq.user!.userId },
      { status, lastActiveAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
});

// ── Status history + screen time ────────────────────────────
router.get("/status/history", authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    await connectDB();
    const { UserStatusHistory } = await import("../models/index.js");

    const days = Math.min(parseInt(req.query.days as string) || 7, 30);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - days);

    const sessions = await UserStatusHistory.find({
      userId: authReq.user!.userId,
      loginTimestamp: { $gte: since },
    })
      .sort({ loginTimestamp: -1 })
      .lean() as any[];

    // Aggregate: use durations if available, otherwise estimate from session span
    const totals: Record<string, number> = {};
    const dailyBreakdown: Record<string, Record<string, number>> = {};

    for (const session of sessions) {
      const dateKey = new Date(session.loginTimestamp).toISOString().slice(0, 10);
      if (!dailyBreakdown[dateKey]) dailyBreakdown[dateKey] = {};

      if (session.durations && session.durations.length > 0) {
        // Use recorded slices
        for (const slice of session.durations) {
          const dur = slice.durationSeconds || 0;
          if (dur <= 0) continue;
          totals[slice.status] = (totals[slice.status] || 0) + dur;
          dailyBreakdown[dateKey][slice.status] = (dailyBreakdown[dateKey][slice.status] || 0) + dur;
        }
      } else {
        // Estimate from session span — attribute to last known status
        const end = session.logoutTimestamp ? new Date(session.logoutTimestamp) : new Date();
        const start = new Date(session.loginTimestamp);
        const dur = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
        const status = session.status || "Online";
        totals[status] = (totals[status] || 0) + dur;
        dailyBreakdown[dateKey][status] = (dailyBreakdown[dateKey][status] || 0) + dur;
      }
    }

    res.json({
      sessions: sessions.map((s: any) => ({
        id: s._id,
        login: s.loginTimestamp,
        logout: s.logoutTimestamp,
        lastActive: s.lastActiveTime,
        status: s.status,
        durations: s.durations || [],
      })),
      totals,
      daily: dailyBreakdown,
      days,
    });
  } catch (error: any) {
    console.error("[StatusHistory] Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch history" });
  }
});

router.post("/send-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) return res.json({ success: true });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    profile.resetPasswordOTP = otp;
    profile.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await profile.save();

    await sendVerificationEmail({
      to: email,
      otp,
      resetUrl: `${process.env.FRONTEND_URL}`,
    }).catch((err) => {
      console.error("[Verification] Email failed:", err);
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed" });
  }
});

router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) {
      return res.json({ success: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    profile.resetPasswordOTP = otp;
    profile.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await profile.save();

    await sendForgotPasswordEmail({
      to: email,
      otp,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password`,
    }).catch((err) => {
      console.error("[ForgotPassword] Email failed:", err);
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: error.message || "Failed" });
  }
});

router.post("/reset-password", validateBody(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!profile.resetPasswordOTP || profile.resetPasswordOTP !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (profile.resetPasswordExpires && new Date() > new Date(profile.resetPasswordExpires)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    profile.passwordHash = await bcrypt.hash(newPassword, 12);
    profile.resetPasswordOTP = undefined;
    profile.resetPasswordExpires = undefined;
    await profile.save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Reset failed" });
  }
});

export default router;
