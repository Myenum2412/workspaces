/**
 * ProfileService — business logic for profile CRUD, history, activity, completion tracking.
 */
import { connectDB } from "../config/connection.js";
import { UserProfile } from "../models/index.js";
import { ProfileHistory, IProfileChange } from "../models/index.js";
import { ProfileActivity } from "../models/index.js";
import { getIO } from "../ws/server.js";
import type { Request } from "express";

// ── Completion weights ──────────────────────────────────────
const COMPLETION_FIELDS: { field: string; weight: number; check: (v: any) => boolean }[] = [
  { field: "firstName", weight: 15, check: (v) => !!v?.trim() },
  { field: "lastName", weight: 15, check: (v) => !!v?.trim() },
  { field: "phone", weight: 10, check: (v) => !!v?.trim() },
  { field: "designation", weight: 10, check: (v) => !!v?.trim() },
  { field: "bio", weight: 5, check: (v) => !!v?.trim() },
  { field: "avatarUrl", weight: 10, check: (v) => !!v?.trim() },
  { field: "address", weight: 10, check: (v) => !!(v?.city || v?.country || v?.street) },
  { field: "department", weight: 5, check: (v) => !!v?.trim() },
  { field: "personalEmail", weight: 5, check: (v) => !!v?.trim() },
  { field: "personalPhone", weight: 5, check: (v) => !!v?.trim() },
  { field: "expertise", weight: 5, check: (v) => Array.isArray(v) && v.length > 0 },
  { field: "gender", weight: 5, check: (v) => !!v?.trim() },
];

export function computeCompletion(profile: Record<string, unknown>): number {
  let total = 0;
  for (const { field, weight, check } of COMPLETION_FIELDS) {
    if (check(profile[field])) total += weight;
  }
  return Math.min(total, 100);
}

// ── Diff helper ──────────────────────────────────────────────
function diffFields(
  oldDoc: Record<string, unknown>,
  newData: Record<string, unknown>,
): IProfileChange[] {
  const changes: IProfileChange[] = [];
  const skipKeys = new Set(["profileVersion", "profileCompletion", "loginCount", "lastLogin", "deviceInfo", "updatedAt", "createdAt"]);

  for (const [key, newVal] of Object.entries(newData)) {
    if (skipKeys.has(key)) continue;
    if (key === "address") {
      const oldAddr = (oldDoc.address ?? {}) as Record<string, unknown>;
      const newAddr = (newVal ?? {}) as Record<string, unknown>;
      for (const addrKey of Object.keys(newAddr)) {
        if (oldAddr[addrKey] !== newAddr[addrKey]) {
          changes.push({
            field: `address.${addrKey}`,
            oldValue: oldAddr[addrKey],
            newValue: newAddr[addrKey],
          });
        }
      }
      continue;
    }
    const oldVal = oldDoc[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

// ── Service ──────────────────────────────────────────────────
export const ProfileService = {
  async getProfile(userId: string) {
    await connectDB();
    const user = await UserProfile.findById(userId).lean() as any;
    if (!user) return null;
    const completion = computeCompletion(user);
    return { ...user, profileCompletion: completion };
  },

  async updateProfile(
    userId: string,
    changes: Record<string, unknown>,
    modifiedBy: string | null,
    modifiedByEmail?: string,
  ) {
    await connectDB();

    const session = await UserProfile.startSession();
    let result: any;

    try {
      await session.withTransaction(async () => {
        const oldDoc = await UserProfile.findById(userId).session(session).lean() as any;
        if (!oldDoc) throw new Error("User not found");

        // Diff and record history
        const fieldChanges = diffFields(oldDoc as any, changes);
        const newVersion = (oldDoc.profileVersion ?? 1) + 1;
        const completion = computeCompletion({ ...oldDoc, ...changes });

        if (fieldChanges.length > 0) {
          await ProfileHistory.create([{
            _id: crypto.randomUUID(),
            userId,
            changes: fieldChanges,
            modifiedBy,
            modifiedByEmail,
            profileVersion: newVersion,
          }], { session });
        }

        // Apply update
        const updateDoc = {
          ...changes,
          profileVersion: newVersion,
          profileCompletion: completion,
        };
        result = await UserProfile.findByIdAndUpdate(
          userId,
          { $set: updateDoc },
          { new: true, session, runValidators: true },
        ).lean();
      });
    } finally {
      await session.endSession();
    }

    // Broadcast real-time update
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("profile_updated", {
        userId,
        profileVersion: result.profileVersion,
      });
      if (result.organizationId) {
        io.to(`org:${result.organizationId}`).emit("profile_updated", {
          userId,
        });
      }
    }

    return result;
  },

  async getProfileHistory(userId: string, page: number, limit: number) {
    await connectDB();
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      ProfileHistory.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProfileHistory.countDocuments({ userId }),
    ]);
    return { entries, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getProfileActivity(userId: string, days?: number) {
    await connectDB();
    const filter: Record<string, any> = { userId };
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      filter.timestamp = { $gte: since };
    }
    const entries = await ProfileActivity.find(filter)
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();
    return entries;
  },

  async listProfiles(orgId: string, filters: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page: number;
    limit: number;
  }) {
    await connectDB();
    const { search, status, sortBy = "createdAt", sortOrder = "desc", page, limit } = filters;
    const filter: Record<string, any> = { organizationId: orgId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      UserProfile.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      UserProfile.countDocuments(filter),
    ]);

    // Attach computed completion
    const enriched = profiles.map((p: any) => ({
      ...p,
      profileCompletion: computeCompletion(p),
    }));

    return { profiles: enriched, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async updateProfileImage(userId: string, avatarUrl: string) {
    await connectDB();
    const old = await UserProfile.findById(userId).lean() as any;
    const result = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl, profileVersion: (old?.profileVersion ?? 1) + 1 } },
      { new: true },
    ).lean() as any;

    // Broadcast avatar change
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("avatar_updated", { userId, avatarUrl });
      if (result?.organizationId) {
        io.to(`org:${result.organizationId}`).emit("avatar_updated", { userId, avatarUrl });
      }
    }

    return result;
  },

  async logActivity(data: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
    req?: Request;
  }) {
    try {
      await connectDB();
      const ipAddress = data.req?.ip ?? undefined;
      let location: string | undefined = undefined;

      if (ipAddress && ipAddress !== "::1" && ipAddress !== "127.0.0.1" && ipAddress !== "::ffff:127.0.0.1") {
        try {
          const res = await fetch(`http://ip-api.com/json/${ipAddress}`);
          if (res.ok) {
            const geo = await res.json();
            if (geo.status === "success") {
              location = `${geo.city}, ${geo.country}`;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const deviceInfo = data.req ? {
        userAgent: data.req.get("user-agent") ?? undefined,
        ip: data.req.ip ?? undefined,
        location,
      } : undefined;

      await ProfileActivity.create({
        _id: crypto.randomUUID(),
        userId: data.userId,
        action: data.action,
        metadata: data.metadata ?? {},
        deviceInfo,
        ipAddress,
        timestamp: new Date(),
      });
    } catch {
      // Fail silently — activity logging must not break main flow
    }
  },

  async exportProfile(userId: string) {
    await connectDB();
    const [profile, history, activity] = await Promise.all([
      UserProfile.findById(userId).lean(),
      ProfileHistory.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
      ProfileActivity.find({ userId }).sort({ timestamp: -1 }).limit(200).lean(),
    ]);
    return { profile, history, activity, exportedAt: new Date().toISOString() };
  },

  async updateLoginInfo(userId: string, req: Request) {
    try {
      await connectDB();
      const userAgent = req.get("user-agent") ?? "";
      let ip = req.ip ?? "";
      let location = "Unknown Location";

      if (ip && ip !== "::1" && ip !== "127.0.0.1" && ip !== "::ffff:127.0.0.1") {
        try {
          const res = await fetch(`http://ip-api.com/json/${ip}`);
          if (res.ok) {
            const geo = await res.json();
            if (geo.status === "success") {
              location = `${geo.city}, ${geo.country}`;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const device: any = { userAgent, ip, location, lastUsed: new Date() };

      // Parse basic device info from UA
      if (/mobile/i.test(userAgent)) device.deviceType = "mobile";
      else if (/tablet/i.test(userAgent)) device.deviceType = "tablet";
      else device.deviceType = "desktop";

      // Keep last 5 devices
      await UserProfile.findByIdAndUpdate(userId, {
        $set: { lastLogin: new Date() },
        $inc: { loginCount: 1 },
        $push: { deviceInfo: { $each: [device], $slice: -5 } },
      });
    } catch {
      // Non-critical — don't block login
    }
  },

  async adminSetStatus(userId: string, status: string, reason: string | undefined, adminId: string, adminEmail?: string) {
    await connectDB();
    const old = await UserProfile.findById(userId).lean() as any;
    if (!old) throw new Error("User not found");

    const result = await UserProfile.findByIdAndUpdate(
      userId,
      { $set: { status, profileVersion: (old.profileVersion ?? 1) + 1 } },
      { new: true },
    ).lean() as any;

    // Record history
    await ProfileHistory.create({
      _id: crypto.randomUUID(),
      userId,
      changes: [{ field: "status", oldValue: old.status, newValue: status }],
      modifiedBy: adminId,
      modifiedByEmail: adminEmail,
      profileVersion: (old.profileVersion ?? 1) + 1,
      reason,
    });

    // Activity log
    await this.logActivity({
      userId,
      action: status === "suspended" ? "account_suspended" : "account_activated",
      metadata: { reason, adminId },
    });
    await this.logActivity({
      userId: adminId,
      action: "admin_status_change",
      metadata: { targetUserId: userId, newStatus: status, reason },
    });

    // Broadcast
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit("profile_updated", { userId, status });
    }

    return result;
  },
};
