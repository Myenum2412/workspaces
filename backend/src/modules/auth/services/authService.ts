import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "../../../config/env.js";
import { connectDB } from "../../../db/connection.js";
import { getRedis, isRedisConnected } from "../../../db/redis.js";
import { User, Organization, Workspace, OrgMember, OrgInvitation } from "../../../models/index.js";
import { AuthenticationError, ConflictError, NotFoundError, AccountLockedError } from "../../../core/errors/AppError.js";
import { logger } from "../../../core/logging/logger.js";
import type { AuthPayload } from "../../../middleware/auth.js";

const LOCKOUT_PREFIX = "lockout:";
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_SECONDS = 15 * 60;

async function getLockout(key: string) {
  const k = `${LOCKOUT_PREFIX}${key}`;
  if (isRedisConnected()) { const v = await getRedis()!.get(k); return v ? JSON.parse(v) : null; }
  return memLockout.get(k) || null;
}
async function setLockout(key: string, val: Record<string, unknown>) {
  const k = `${LOCKOUT_PREFIX}${key}`;
  if (isRedisConnected()) await getRedis()!.setex(k, LOCKOUT_SECONDS, JSON.stringify(val));
  else memLockout.set(k, val);
}
async function delLockout(key: string) {
  const k = `${LOCKOUT_PREFIX}${key}`;
  if (isRedisConnected()) await getRedis()!.del(k); else memLockout.delete(k);
}
const memLockout = new Map<string, Record<string, unknown>>();

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 100) + "-" + crypto.randomUUID().slice(0, 6);
}

export const authService = {
  async register(input: { firstName: string; lastName: string; email: string; password: string; companyName: string; category?: string; companyRange?: string }) {
    await connectDB();
    const email = input.email.toLowerCase().trim();
    const existing = await User.findOne({ email, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const userId = crypto.randomUUID();
    const orgId = crypto.randomUUID();
    const wsId = crypto.randomUUID();

    const org = new Organization({ _id: orgId, name: input.companyName, slug: slugify(input.companyName), email, ownerEmail: email, ownerId: userId, category: input.category || "", companyRange: input.companyRange || "" });
    const ws = new Workspace({ _id: wsId, organizationId: orgId, name: "Default Workspace", createdBy: userId });
    const user = new User({ _id: userId, email, passwordHash, firstName: input.firstName, lastName: input.lastName, role: "ORG_ADMIN", status: "active", emailVerified: true });
    const member = new OrgMember({ _id: crypto.randomUUID(), organizationId: orgId, workspaceId: wsId, userId, role: "ORG_ADMIN", status: "active", joinedAt: new Date() });

    await Promise.all([org.save(), ws.save(), user.save(), member.save()]);

    logger.info({ userId, orgId, email }, "User registered");
    return { user: { id: userId, email, firstName: input.firstName, lastName: input.lastName, role: "ORG_ADMIN" }, organizationId: orgId };
  },

  async login(email: string, password: string, ip: string, userAgent: string) {
    await connectDB();
    const normEmail = email.toLowerCase().trim();

    const attempt = await getLockout(normEmail);
    if (attempt?.lockedUntil && new Date(attempt.lockedUntil as string) > new Date()) {
      const mins = Math.ceil((new Date(attempt.lockedUntil as string).getTime() - Date.now()) / 60000);
      throw new AccountLockedError(`Account locked. Try again in ${mins} minute(s).`);
    }

    const user = await User.findOne({ email: normEmail, deletedAt: null }).select("+passwordHash +twoFactorSecret").lean() as Record<string, unknown> | null;
    if (!user) { await this.recordFailedLogin(normEmail); throw new AuthenticationError("Invalid email or password"); }

    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) {
      await this.recordFailedLogin(normEmail);
      await LoginActivity.create({ userId: user._id as string, email: normEmail, ipAddress: ip, userAgent, status: "failed", failureReason: "Invalid password" });
      throw new AuthenticationError("Invalid email or password");
    }

    if (user.twoFactorEnabled) {
      return { requiresTwoFactor: true, tempToken: this.createTempToken(user._id as string) };
    }

    return this.completeLogin(user._id as string, normEmail, user.role as string, ip, userAgent);
  },

  async completeLogin(userId: string, email: string, role: string, ip: string, userAgent: string) {
    await connectDB();
    const membership = await OrgMember.findOne({ userId, status: "active", deletedAt: null }).lean();
    const payload: AuthPayload = { userId, email, organizationId: membership?.organizationId || "", workspaceId: membership?.workspaceId || null, role };

    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date(), lastLoginIp: ip, $inc: { loginCount: 1 }, failedLoginAttempts: 0 });
    await LoginActivity.create({ userId, email, ipAddress: ip, userAgent, status: "success" });
    await delLockout(email);

    logger.info({ userId, email }, "User logged in");
    return { user: { id: userId, email, role, organizationId: membership?.organizationId, workspaceId: membership?.workspaceId } };
  },

  async recordFailedLogin(email: string) {
    const existing = await getLockout(email) as Record<string, unknown> | null;
    const now = new Date();
    if (!existing || (existing.lockedUntil && new Date(existing.lockedUntil as string) < now)) {
      await setLockout(email, { count: 1, lastAttempt: now.toISOString(), lockedUntil: null }); return;
    }
    existing.count = (existing.count as number) + 1;
    existing.lastAttempt = now.toISOString();
    if ((existing.count as number) >= LOCKOUT_THRESHOLD) existing.lockedUntil = new Date(now.getTime() + LOCKOUT_SECONDS * 1000).toISOString();
    await setLockout(email, existing);
  },

  createTempToken(userId: string): string {
    const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
    return jwt.sign({ userId, twoFactorPending: true }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
  },

  async setup2FA(userId: string) {
    await connectDB();
    const secret = authenticator.generateSecret();
    await User.findByIdAndUpdate(userId, { twoFactorSecret: secret });
    const user = await User.findById(userId).lean() as Record<string, unknown>;
    const otpauth = authenticator.keyuri(user.email as string, "WorkspaceAPI", secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    return { secret, qrCode };
  },

  async verifyAndEnable2FA(userId: string, token: string) {
    await connectDB();
    const user = await User.findById(userId).select("+twoFactorSecret").lean() as Record<string, unknown>;
    if (!user?.twoFactorSecret) throw new NotFoundError("2FA setup");
    const valid = authenticator.verify({ token, secret: user.twoFactorSecret as string });
    if (!valid) throw new AuthenticationError("Invalid 2FA token");
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });
    return { enabled: true };
  },

  async disable2FA(userId: string, password: string) {
    await connectDB();
    const user = await User.findById(userId).select("+passwordHash").lean() as Record<string, unknown>;
    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) throw new AuthenticationError("Invalid password");
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: false, twoFactorSecret: null });
    return { disabled: true };
  },

  async forgotPassword(email: string) {
    await connectDB();
    const normEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normEmail, deletedAt: null }).lean();
    if (!user) return;
    const token = crypto.randomUUID();
    await OrgInvitation.create({ _id: crypto.randomUUID(), organizationId: "system", email: normEmail, role: "MEMBER", invitedBy: "system", token, status: "pending", expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    logger.info({ email: normEmail }, "Password reset requested");
  },

  async resetPassword(email: string, token: string, newPassword: string) {
    await connectDB();
    const normEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normEmail, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User");
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await User.findByIdAndUpdate(user._id, { passwordHash });
    logger.info({ userId: user._id }, "Password reset");
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await connectDB();
    const user = await User.findById(userId).select("+passwordHash").lean() as Record<string, unknown>;
    if (!user) throw new NotFoundError("User");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash as string);
    if (!valid) throw new AuthenticationError("Current password incorrect");
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await User.findByIdAndUpdate(userId, { passwordHash });
  },

  async getMe(userId: string) {
    await connectDB();
    const user = await User.findOne({ _id: userId, deletedAt: null }).lean() as Record<string, unknown> | null;
    if (!user) throw new NotFoundError("User");
    const membership = await OrgMember.findOne({ userId, deletedAt: null }).lean();
    const org = membership ? await Organization.findById(membership.organizationId).lean() : null;
    return {
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, role: user.role, status: user.status, emailVerified: user.emailVerified, twoFactorEnabled: user.twoFactorEnabled },
      organization: org ? { id: org._id, name: org.name } : null,
      membership: membership ? { role: membership.role, organizationId: membership.organizationId, workspaceId: membership.workspaceId } : null,
    };
  },
};
