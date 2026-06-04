import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../../../config/env.js";
import { connectDB } from "../../../db/connection.js";
import { User, OrgMember, Organization, Workspace } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";
import { logger } from "../../../core/logging/logger.js";

export const userService = {
  async list(organizationId: string, params: { page: number; limit: number; search?: string; status?: string; role?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (params.search) filter.$or = [{ email: { $regex: params.search, $options: "i" } }, { firstName: { $regex: params.search, $options: "i" } }, { lastName: { $regex: params.search, $options: "i" } }];
    if (params.status) filter.status = params.status;
    if (params.role) filter.role = params.role;
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).select("email firstName lastName avatarUrl role status emailVerified lastLoginAt loginCount createdAt").lean(),
      User.countDocuments(filter),
    ]);
    return { users, total };
  },

  async getById(userId: string, organizationId: string) {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User");
    const memberships = await OrgMember.find({ userId, organizationId, deletedAt: null }).populate("workspace organization").lean();
    return { ...user, memberships };
  },

  async create(inviterId: string, organizationId: string, data: { email: string; firstName: string; lastName: string; role: string; workspaceId?: string; designation?: string; department?: string; phone?: string }) {
    await connectDB();
    const email = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Email already registered");

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
    const userId = crypto.randomUUID();

    const user = new User({ _id: userId, email, passwordHash, firstName: data.firstName, lastName: data.lastName, role: data.role, phone: data.phone || "" });
    const member = new OrgMember({ _id: crypto.randomUUID(), organizationId, workspaceId: data.workspaceId || null, userId, role: data.role, status: "active", invitedBy: inviterId, joinedAt: new Date() });

    await Promise.all([user.save(), member.save()]);
    logger.info({ userId, email, organizationId }, "User created");
    return { user: { id: userId, email, firstName: data.firstName, role: data.role }, tempPassword };
  },

  async update(userId: string, organizationId: string, data: Record<string, unknown>) {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User");
    const updated = await User.findByIdAndUpdate(userId, { $set: data }, { new: true }).lean();
    return updated;
  },

  async updateRole(userId: string, organizationId: string, role: string, workspaceId?: string) {
    await connectDB();
    const member = await OrgMember.findOne({ userId, organizationId, deletedAt: null }).lean();
    if (!member) throw new NotFoundError("Membership");
    const updated = await OrgMember.findByIdAndUpdate(member._id, { $set: { role, workspaceId: workspaceId || member.workspaceId } }, { new: true }).lean();
    return updated;
  },

  async delete(userId: string, organizationId: string) {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User");
    await User.findByIdAndUpdate(userId, { $set: { deletedAt: new Date(), status: "inactive" } });
    return { deleted: true };
  },

  async bulkAction(organizationId: string, userIds: string[], action: string) {
    await connectDB();
    const statusMap: Record<string, string> = { activate: "active", deactivate: "inactive", suspend: "suspended" };
    if (action === "delete") {
      await User.updateMany({ _id: { $in: userIds }, organizationId, deletedAt: null }, { $set: { deletedAt: new Date(), status: "inactive" } });
    } else {
      await User.updateMany({ _id: { $in: userIds }, organizationId, deletedAt: null }, { $set: { status: statusMap[action] || "active" } });
    }
    return { affected: userIds.length };
  },
};
