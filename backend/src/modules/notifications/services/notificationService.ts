import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Notification } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";
import type {
  CreateNotificationInput,
  PaginationParams,
  PaginatedResult,
} from "../../../types/shared.js";

export const notificationService = {
  async list(
    userId: string,
    pagination: PaginationParams,
    unreadOnly?: boolean,
  ): Promise<PaginatedResult<Record<string, unknown>> & { unreadCount: number }> {
    await connectDB();
    const filter: Record<string, unknown> = { userId, deletedAt: null };
    if (unreadOnly) filter.read = false;
    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, read: false, deletedAt: null }),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: notifications,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
      unreadCount,
    };
  },

  async create(data: CreateNotificationInput): Promise<Record<string, unknown>> {
    await connectDB();
    const notification = new Notification({
      _id: crypto.randomUUID(),
      userId: data.userId,
      organizationId: data.organizationId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
    });
    await notification.save();
    return notification.toObject();
  },

  async markRead(id: string, userId: string): Promise<Record<string, unknown> | null> {
    await connectDB();
    const notification = await Notification.findOne({
      _id: id,
      userId,
      deletedAt: null,
    }).lean();
    if (!notification) throw new NotFoundError("Notification", id);
    const updated = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    ).lean();
    return updated;
  },

  async markAllRead(userId: string): Promise<{ marked: boolean }> {
    await connectDB();
    await Notification.updateMany(
      { userId, read: false, deletedAt: null },
      { $set: { read: true, readAt: new Date() } },
    );
    return { marked: true };
  },

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const notification = await Notification.findOne({
      _id: id,
      userId,
      deletedAt: null,
    }).lean();
    if (!notification) throw new NotFoundError("Notification", id);
    await Notification.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
