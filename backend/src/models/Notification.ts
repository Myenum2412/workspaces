// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification {
  _id: string;
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface INotificationDocument extends INotification, Document<string> {}

const NotificationSchema = new Schema<INotificationDocument>({
  _id: { type: String },
  userId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification || mongoose.model<INotificationDocument>("Notification", NotificationSchema);
