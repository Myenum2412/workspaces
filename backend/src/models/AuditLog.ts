import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog {
  _id: string;
  organizationId: string;
  action: string;
  severity: string;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document<string> {}

const AuditLogSchema = new Schema<IAuditLogDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  severity: { type: String, enum: ["info", "warn", "error"], default: "info" },
  userId: { type: String, default: null },
  userEmail: { type: String, default: null },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  method: { type: String, default: null },
  path: { type: String, default: null },
  statusCode: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
