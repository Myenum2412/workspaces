import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../../../config/env.js";
import { connectDB } from "../../../db/connection.js";
import { User, OrgMember, Organization, Workspace } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";
import { logger } from "../../../core/logging/logger.js";
import { getAllowedSortField } from "../../../types/shared.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  PaginationParams,
  PaginatedResult,
} from "../../../types/shared.js";

export const userService = {
  async list(
    organizationId: string,
    pagination: PaginationParams,
    filters: { status?: string; role?: string },
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (filters.status) filter.status = filters.status;
    if (filters.role) filter.role = filters.role;
    if (pagination.search) {
      filter.$or = [
        { email: { $regex: pagination.search, $options: "i" } },
        { firstName: { $regex: pagination.search, $options: "i" } },
        { lastName: { $regex: pagination.search, $options: "i" } },
      ];
    }
    const sortField = getAllowedSortField("users", pagination.sortBy);
    const sort: Record<string, 1 | -1> = { [sortField]: pagination.sortOrder === "asc" ? 1 : -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .select("email firstName lastName avatarUrl role status emailVerified lastLoginAt loginCount createdAt")
        .lean(),
      User.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: users,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },

  async getById(userId: string, organizationId: string): Promise<Record<string, unknown>> {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User", userId);
    const memberships = await OrgMember.find({ userId, organizationId, deletedAt: null })
      .populate("workspace organization")
      .lean();
    return { ...user, memberships };
  },

  async create(
    inviterId: string,
    organizationId: string,
    data: CreateUserInput,
  ): Promise<{ user: Record<string, unknown>; tempPassword: string }> {
    await connectDB();
    const email = data.email.toLowerCase().trim();
    const existing = await User.findOne({ email, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Email already registered");

    const tempPassword = crypto.randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
    const userId = crypto.randomUUID();

    const user = new User({
      _id: userId,
      email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone || "",
    });
    const member = new OrgMember({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceId: data.workspaceId || null,
      userId,
      role: data.role,
      status: "active",
      invitedBy: inviterId,
      joinedAt: new Date(),
    });

    await Promise.all([user.save(), member.save()]);
    logger.info({ userId, email, organizationId }, "User created");
    return {
      user: { id: userId, email, firstName: data.firstName, role: data.role },
      tempPassword,
    };
  },

  async update(userId: string, organizationId: string, data: UpdateUserInput): Promise<Record<string, unknown> | null> {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User", userId);
    const updated = await User.findByIdAndUpdate(userId, { $set: data }, { new: true }).lean();
    return updated;
  },

  async updateRole(
    userId: string,
    organizationId: string,
    role: string,
    workspaceId?: string,
  ): Promise<Record<string, unknown> | null> {
    await connectDB();
    const member = await OrgMember.findOne({ userId, organizationId, deletedAt: null }).lean();
    if (!member) throw new NotFoundError("Membership");
    const updated = await OrgMember.findByIdAndUpdate(
      member._id,
      { $set: { role, workspaceId: workspaceId || member.workspaceId } },
      { new: true },
    ).lean();
    return updated;
  },

  async remove(userId: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const user = await User.findOne({ _id: userId, organizationId, deletedAt: null }).lean();
    if (!user) throw new NotFoundError("User", userId);
    await User.findByIdAndUpdate(userId, {
      $set: { deletedAt: new Date(), status: "inactive" },
    });
    return { deleted: true };
  },

  async bulkAction(
    organizationId: string,
    userIds: string[],
    action: string,
  ): Promise<{ affected: number }> {
    await connectDB();
    const statusMap: Record<string, string> = {
      activate: "active",
      deactivate: "inactive",
      suspend: "suspended",
    };
    if (action === "delete") {
      await User.updateMany(
        { _id: { $in: userIds }, organizationId, deletedAt: null },
        { $set: { deletedAt: new Date(), status: "inactive" } },
      );
    } else {
      await User.updateMany(
        { _id: { $in: userIds }, organizationId, deletedAt: null },
        { $set: { status: statusMap[action] || "active" } },
      );
    }
    return { affected: userIds.length };
  },
};
