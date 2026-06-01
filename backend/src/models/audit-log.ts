import mongoose, { Schema, Document } from "mongoose";

// ── Audit Log ───────────────────────────────────────────────

export interface IAuditLog extends Document<string> {
  organizationId: string;
  action: string;
  severity: "info" | "warn" | "error";
  userId: string | null;
  userEmail: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
  sessionId: string | null;
  sessionName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  action: { type: String, required: true, index: true },
  severity: { type: String, enum: ["info", "warn", "error"], default: "info" },
  userId: { type: String, default: null },
  userEmail: { type: String, default: null },
  apiKeyId: { type: String, default: null },
  apiKeyName: { type: String, default: null },
  sessionId: { type: String, default: null },
  sessionName: { type: String, default: null },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  method: { type: String, default: null },
  path: { type: String, default: null },
  statusCode: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, action: 1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

// ── Activity Log ─────────────────────────────────────────────

export interface IActivityLog extends Document<string> {
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
ActivityLogSchema.index({ organizationId: 1, userId: 1 });
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const ActivityLog = mongoose.models.ActivityLog ?? mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
