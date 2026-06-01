import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { connectDB } from "../config/connection.js";
import { env } from "../config/env.js";
import { isSuperAdmin } from "../config/env.js";
import { getRedis, isRedisConnected } from "../redis/connection.js";
import { setCsrfCookie } from "../middleware/security.js";
import {
  UserProfile,
  Organization,
  OrgMember,
} from "../models/index.js";
import {
  authenticate,
  signAccessToken,
  signRefreshToken,
  signTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserSessions,
  AuthRequest,
  setAuthCookies,
  clearAuthCookies,
} from "../middleware/auth.js";
import { catchAsync } from "../core/utils/catchAsync.js";
import { apiResponse } from "../core/utils/apiResponse.js";
import { NotFoundError, AccountLockedError, AuthenticationError, ConflictError } from "../core/errors/AppError.js";
import { validateBody } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.js";
import { sendForgotPasswordEmail, sendSignupWelcomeEmail, sendVerificationEmail } from "../email/resend.js";
import { getIO } from "../ws/server.js";

const router = Router();

// ── Account Lockout Tracking (Redis) ──────────────────────────

const LOCKOUT_PREFIX = "lockout:";
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

interface LoginAttempt {
  count: number;
  lastAttempt: string;
  lockedUntil: string | null;
}

async function getLoginAttempt(email: string): Promise<LoginAttempt | null> {
  const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
  if (isRedisConnected()) {
    const r = getRedis()!;
    const raw = await r.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  return fallbackLoginAttempts.get(key) || null;
}

async function setLoginAttempt(email: string, attempt: LoginAttempt): Promise<void> {
  const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
  if (isRedisConnected()) {
    const r = getRedis()!;
    await r.setex(key, LOCKOUT_DURATION_SECONDS, JSON.stringify(attempt));
  } else {
    fallbackLoginAttempts.set(key, attempt);
  }
}

async function deleteLoginAttempt(email: string): Promise<void> {
  const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
  if (isRedisConnected()) {
    const r = getRedis()!;
    await r.del(key);
  } else {
    fallbackLoginAttempts.delete(key);
  }
}

/** Fallback in-memory for dev without Redis */
const fallbackLoginAttempts = new Map<string, LoginAttempt>();

// Periodic cleanup for fallback store
setInterval(() => {
  const now = new Date();
  for (const [key, attempt] of fallbackLoginAttempts) {
    if (attempt.lockedUntil && new Date(attempt.lockedUntil) < now) {
      fallbackLoginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function checkAccountLockout(email: string): Promise<void> {
  const attempt = await getLoginAttempt(email);
  if (attempt?.lockedUntil && new Date(attempt.lockedUntil) > new Date()) {
    const remainingMin = Math.ceil((new Date(attempt.lockedUntil).getTime() - Date.now()) / 60000);
    throw new AccountLockedError(
      `Account is locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`
    );
  }
}

async function recordFailedLogin(email: string): Promise<void> {
  const key = email.toLowerCase();
  const existing = await getLoginAttempt(key);
  const now = new Date();

  if (!existing || (existing.lockedUntil && new Date(existing.lockedUntil) < now)) {
    await setLoginAttempt(key, { count: 1, lastAttempt: now.toISOString(), lockedUntil: null });
    return;
  }

  existing.count += 1;
  existing.lastAttempt = now.toISOString();

  if (existing.count >= LOCKOUT_THRESHOLD) {
    existing.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_SECONDS * 1000).toISOString();
  }

  await setLoginAttempt(key, existing);
}

async function clearLoginAttempts(email: string): Promise<void> {
  await deleteLoginAttempt(email.toLowerCase());
}

// ── Passport Google OAuth ──────────────────────────────────────

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
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
            await UserProfile.create({
              _id: userId,
              userId,
              email,
              firstName,
              lastName,
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
            user = await UserProfile.findOne({ email }).lean() as any;
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

// ── Google OAuth routes ───────────────────────────────────────

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const tokens = signTokenPair(
      { userId: user._id.toString(), email: user.email, organizationId: user.organizationId ?? "", role: "owner" },
      req
    );
    // Set httpOnly cookies
    setAuthCookies(res, tokens);
    res.redirect(`${env.FRONTEND_URL}/workspace`);
  }
);

// ── LinkedIn OAuth routes (placeholder) ────────────────────────

router.get("/linkedin", (_req: Request, res: Response) => {
  apiResponse.success(res, null, 501);
});

// ── Register ───────────────────────────────────────────────────

router.post(
  "/register",
  validateBody(registerSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { firstName, lastName, companyName, email, category, companyRange } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const existing = await UserProfile.findOne({ email: normalizedEmail, deletedAt: null }).lean();
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();

    const session = await UserProfile.startSession();
    try {
      await session.withTransaction(async () => {
        await Organization.create([{
          _id: orgId,
          name: companyName,
          category: category || "Other",
          companyRange: companyRange || "1-10",
        }], { session });

        await UserProfile.create([{
          _id: userId,
          userId,
          email: normalizedEmail,
          firstName,
          lastName,
          passwordHash,
          organizationId: orgId,
          designation: "workspace",
        }], { session });

        await OrgMember.create([{
          _id: crypto.randomUUID(),
          organizationId: orgId,
          userId,
          role: "owner",
          status: "active",
          joinedAt: new Date().toISOString(),
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    const tokens = signTokenPair(
      { userId, email: normalizedEmail, organizationId: orgId, role: "owner" },
      req
    );

    // Set httpOnly cookies
    setAuthCookies(res, tokens);
    setCsrfCookie(req, res);

    const loginUrl = `${env.FRONTEND_URL}/login`;
    sendSignupWelcomeEmail({
      to: normalizedEmail,
      name: `${firstName} ${lastName}`.trim(),
      password: tempPassword,
      verifyUrl: loginUrl,
    }).catch((err: Error) => {
      console.error("[Signup] Welcome email failed:", err);
    });

    apiResponse.created(res, {
      password: tempPassword,
      user: { $id: userId, email: normalizedEmail, name: `${firstName} ${lastName}`, firstName, lastName },
      organization: { $id: orgId, name: companyName },
    }, req.requestId);
  })
);

// ── Login ──────────────────────────────────────────────────────

router.post(
  "/login",
  validateBody(loginSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    await checkAccountLockout(normalizedEmail);

    const profile = await UserProfile.findOne({ email: normalizedEmail }).lean() as any;
    if (!profile) {
      await recordFailedLogin(normalizedEmail);
      throw new AuthenticationError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, profile.passwordHash ?? "");
    if (!valid) {
      await recordFailedLogin(normalizedEmail);
      throw new AuthenticationError("Invalid email or password");
    }

    await clearLoginAttempts(normalizedEmail);

    const member = await OrgMember.findOne({ userId: profile._id.toString() }).lean() as any;
    const userId = profile._id.toString();

    const { ProfileService } = await import("../services/profile.js");
    ProfileService.updateLoginInfo(userId, req).catch(() => {});
    ProfileService.logActivity({ userId, action: "user_login", req }).catch(() => {});

    const tokens = signTokenPair(
      {
        userId,
        email: profile.email,
        organizationId: member?.organizationId ?? profile.organizationId ?? "",
        role: member?.role ?? "member",
      },
      req
    );

    // Set httpOnly cookies
    setAuthCookies(res, tokens);
    setCsrfCookie(req, res);

    apiResponse.success(
      res,
      {
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
      },
      200,
      req.requestId
    );
  })
);

// ── Refresh Token ──────────────────────────────────────────────

router.post(
  "/refresh",
  catchAsync(async (req: Request, res: Response) => {
    // Extract refresh token from cookie or body
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new AuthenticationError("Refresh token required");
    }

    const { payload, tokenId } = await verifyRefreshToken(refreshToken);
    await revokeRefreshToken(tokenId);

    const tokens = signTokenPair(payload, req);

    // Set new httpOnly cookies
    setAuthCookies(res, tokens);

    apiResponse.success(
      res,
      { message: "Token refreshed" },
      200,
      req.requestId
    );
  })
);

// ── Logout ─────────────────────────────────────────────────────

router.post(
  "/logout",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { all } = req.body;

    if (all) {
      await revokeAllUserTokens(authReq.user!.userId);
    } else {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      if (refreshToken && typeof refreshToken === "string") {
        try {
          const decoded = jwt.decode(refreshToken) as { tokenId?: string } | null;
          if (decoded?.tokenId) {
            await revokeRefreshToken(decoded.tokenId);
          }
        } catch {
          // Token might be expired — continue with logout
        }
      }
    }

    const { ProfileService } = await import("../services/profile.js");
    ProfileService.logActivity({ userId: authReq.user!.userId, action: "user_logout", req }).catch(() => {});

    // Clear httpOnly cookies
    clearAuthCookies(res);
    res.clearCookie("csrf_token", { path: "/" });

    apiResponse.success(res, null, 200, req.requestId);
  })
);

// ── Get CSRF Token ─────────────────────────────────────────────

router.get("/csrf-token", (req: Request, res: Response) => {
  setCsrfCookie(req, res);
  apiResponse.success(res, { message: "CSRF token set" }, 200, req.requestId);
});

// ── Get Active Sessions ────────────────────────────────────────

router.get(
  "/sessions",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const sessions = await getUserSessions(authReq.user!.userId);

    apiResponse.success(res, { sessions }, 200, req.requestId);
  })
);

// ── Get Me ─────────────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    await connectDB();

    const [profile, member] = await Promise.all([
      UserProfile.findById(authReq.user!.userId).lean() as Promise<any>,
      OrgMember.findOne({ userId: authReq.user!.userId }).lean() as Promise<any>,
    ]);

    if (!profile) {
      throw new NotFoundError("User");
    }

    let organization = null;
    if (member) {
      organization = await Organization.findById(member.organizationId).lean() as any;
    }

    apiResponse.success(
      res,
      {
        user: {
          $id: profile._id.toString(),
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim(),
          avatarUrl: profile.avatarUrl,
          emailVerified: profile.emailVerified,
          role: member?.role ?? "member",
          organizationId: member?.organizationId ?? profile.organizationId ?? "",
        },
        organization: organization
          ? { $id: organization._id.toString(), name: organization.name }
          : null,
        membership: member
          ? { role: member.role, organizationId: member.organizationId }
          : null,
      },
      200,
      req.requestId
    );
  })
);

// ── Change Password ────────────────────────────────────────────

router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;

    await connectDB();
    const profile = await UserProfile.findById(authReq.user!.userId);
    if (!profile) {
      throw new NotFoundError("User");
    }

    const valid = await bcrypt.compare(currentPassword, profile.passwordHash ?? "");
    if (!valid) {
      throw new AuthenticationError("Current password is incorrect");
    }

    profile.passwordHash = await bcrypt.hash(newPassword, 12);
    await profile.save();

    apiResponse.success(res, null, 200, req.requestId);
  })
);

// ── Forgot Password ────────────────────────────────────────────

router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();
    const profile = await UserProfile.findOne({ email: normalizedEmail }) as any;
    if (!profile) {
      apiResponse.success(res, null, 200, req.requestId);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    profile.resetPasswordOTP = await bcrypt.hash(otp, 10);
    profile.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await profile.save();

    sendForgotPasswordEmail({
      to: normalizedEmail,
      otp,
      resetUrl: `${env.FRONTEND_URL}/reset-password`,
    }).catch((err: Error) => {
      console.error("[ForgotPassword] Email failed:", err);
    });

    apiResponse.success(res, null, 200, req.requestId);
  })
);

// ── Reset Password ─────────────────────────────────────────────

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();
    const profile = await UserProfile.findOne({ email: normalizedEmail }) as any;
    if (!profile) {
      throw new NotFoundError("User");
    }

    if (!profile.resetPasswordOTP) {
      throw new AuthenticationError("No OTP was requested. Please request a new one.");
    }

    if (profile.resetPasswordExpires && new Date() > new Date(profile.resetPasswordExpires)) {
      throw new AuthenticationError("OTP has expired. Please request a new one.");
    }

    const otpValid = await bcrypt.compare(otp, profile.resetPasswordOTP);
    if (!otpValid) {
      throw new AuthenticationError("Invalid OTP");
    }

    profile.passwordHash = await bcrypt.hash(newPassword, 12);
    profile.resetPasswordOTP = undefined;
    profile.resetPasswordExpires = undefined;
    await profile.save();

    await revokeAllUserTokens(profile._id.toString());

    apiResponse.success(res, null, 200, req.requestId);
  })
);

// ── Verify Email ───────────────────────────────────────────────

router.post(
  "/verify",
  catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) {
      throw new NotFoundError("User");
    }
    profile.emailVerified = true;
    profile.verifiedAt = new Date();
    await profile.save();

    const io = getIO();
    if (io) {
      io.emit("verification_update", {
        email: profile.email,
        emailVerified: profile.emailVerified,
        verifiedAt: profile.verifiedAt,
      });
    }

    apiResponse.success(res, null, 200, req.requestId);
  })
);

// ── Email verifications (batch) ────────────────────────────────

router.post(
  "/verifications",
  catchAsync(async (req: Request, res: Response) => {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      throw new AuthenticationError("Invalid emails array");
    }
    await connectDB();
    const profiles = await UserProfile.find({ email: { $in: emails } })
      .select("email emailVerified verifiedAt")
      .lean();
    const verifications = profiles.reduce((acc: any, curr: any) => {
      acc[curr.email] = { emailVerified: curr.emailVerified, verifiedAt: curr.verifiedAt };
      return acc;
    }, {});
    apiResponse.success(res, { verifications }, 200, req.requestId);
  })
);

// ── User statuses (batch) ─────────────────────────────────────

router.post(
  "/statuses",
  catchAsync(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds)) {
      throw new AuthenticationError("Invalid userIds array");
    }
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    const statuses = await UserStatus.find({ userId: { $in: userIds } })
      .select("userId status lastActiveAt")
      .lean();

    const { getOnlineUserIds } = await import("../ws/server.js");
    const onlineIds = getOnlineUserIds();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const now = new Date().getTime();

    const result = statuses.reduce((acc: any, curr: any) => {
      if (onlineIds.has(curr.userId)) {
        acc[curr.userId] = "Online";
        return acc;
      }
      let finalStatus = curr.status;
      if (curr.lastActiveAt) {
        const timeDiff = now - new Date(curr.lastActiveAt).getTime();
        if (timeDiff > TWELVE_HOURS) finalStatus = "Leave";
      }
      acc[curr.userId] = finalStatus;
      return acc;
    }, {});

    apiResponse.success(res, { statuses: result }, 200, req.requestId);
  })
);

// ── Own status ─────────────────────────────────────────────────

router.get(
  "/status",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    const record = await UserStatus.findOne({ userId: authReq.user!.userId }).lean() as any;
    apiResponse.success(
      res,
      { status: record?.status ?? "Offline", lastActiveAt: record?.lastActiveAt ?? null },
      200,
      req.requestId
    );
  })
);

router.post(
  "/status",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { status } = req.body;
    if (!status) throw new AuthenticationError("status required");
    await connectDB();
    const { UserStatus } = await import("../models/index.js");
    await UserStatus.findOneAndUpdate(
      { userId: authReq.user!.userId },
      { status, lastActiveAt: new Date() },
      { upsert: true, new: true }
    );
    apiResponse.success(res, { status }, 200, req.requestId);
  })
);

// ── Status history ─────────────────────────────────────────────

router.get(
  "/status/history",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
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

    const totals: Record<string, number> = {};
    const dailyBreakdown: Record<string, Record<string, number>> = {};

    for (const session of sessions) {
      const dateKey = new Date(session.loginTimestamp).toISOString().slice(0, 10);
      if (!dailyBreakdown[dateKey]) dailyBreakdown[dateKey] = {};

      if (session.durations && session.durations.length > 0) {
        for (const slice of session.durations) {
          const dur = slice.durationSeconds || 0;
          if (dur <= 0) continue;
          totals[slice.status] = (totals[slice.status] || 0) + dur;
          dailyBreakdown[dateKey][slice.status] = (dailyBreakdown[dateKey][slice.status] || 0) + dur;
        }
      } else {
        const end = session.logoutTimestamp ? new Date(session.logoutTimestamp) : new Date();
        const start = new Date(session.loginTimestamp);
        const dur = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
        const status = session.status || "Online";
        totals[status] = (totals[status] || 0) + dur;
        dailyBreakdown[dateKey][status] = (dailyBreakdown[dateKey][status] || 0) + dur;
      }
    }

    const formatted = {
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
    };

    apiResponse.success(res, formatted, 200, req.requestId);
  })
);

// ── Send verification OTP ──────────────────────────────────────

router.post(
  "/send-verification",
  catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    await connectDB();
    const profile = await UserProfile.findOne({ email }) as any;
    if (!profile) {
      apiResponse.success(res, null, 200, req.requestId);
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    profile.resetPasswordOTP = await bcrypt.hash(otp, 10);
    profile.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await profile.save();

    sendVerificationEmail({
      to: email,
      otp,
      resetUrl: `${env.FRONTEND_URL}`,
    }).catch((err: Error) => {
      console.error("[Verification] Email failed:", err);
    });

    apiResponse.success(res, null, 200, req.requestId);
  })
);

export default router;
