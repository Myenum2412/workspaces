import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog {
  _id: string;
  organizationId: string;
  workspaceId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface IActivityLogDocument extends IActivityLog, Document<string> {}

const ActivityLogSchema = new Schema<IActivityLogDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null },
  userId: { type: String, default: null, index: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
}, { timestamps: true });

ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1 });

export const ActivityLog: Model<IActivityLogDocument> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLogDocument>("ActivityLog", ActivityLogSchema);
