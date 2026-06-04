import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Notification } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

export const notificationService = {
  async list(userId: string, params: { page: number; limit: number; unreadOnly?: boolean }) {
    await connectDB();
    const filter: Record<string, unknown> = { userId, deletedAt: null };
    if (params.unreadOnly) filter.read = false;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((params.page - 1) * params.limit).limit(params.limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, read: false, deletedAt: null }),
    ]);
    return { notifications, total, unreadCount };
  },

  async create(data: { userId: string; organizationId: string; type: string; title: string; message: string; recordData?: Record<string, unknown> }) {
    await connectDB();
    const n = new Notification({ _id: crypto.randomUUID(), userId, organizationId: data.organizationId, type: data.type, title: data.title, message: data.message, data: data.recordData || {} });
    await n.save();
    return n.toObject();
  },

  async markRead(id: string, userId: string) {
    await connectDB();
    const n = await Notification.findOne({ _id: id, userId, deletedAt: null }).lean();
    if (!n) throw new NotFoundError("Notification");
    return Notification.findByIdAndUpdate(id, { $set: { read: true, readAt: new Date() } }, { new: true }).lean();
  },

  async markAllRead(userId: string) {
    await connectDB();
    await Notification.updateMany({ userId, read: false, deletedAt: null }, { $set: { read: true, readAt: new Date() } });
    return { marked: true };
  },

  async remove(id: string, userId: string) {
    await connectDB();
    const n = await Notification.findOne({ _id: id, userId, deletedAt: null }).lean();
    if (!n) throw new NotFoundError("Notification");
    await Notification.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
