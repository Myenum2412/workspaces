/**
 * Profile activity log — tracks logins, logouts, profile views, avatar changes,
 * field updates, exports, status changes. TTL 90 days.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceSnapshot {
  userAgent?: string;
  ip?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  location?: string;
}

export interface IProfileActivity extends Document<string> {
  userId: string;
  action:
    | "user_login"
    | "user_logout"
    | "user_register"
    | "avatar_change"
    | "profile_update"
    | "profile_view"
    | "profile_export"
    | "status_change"
    | "password_change"
    | "account_suspended"
    | "account_activated"
    | "email_verified"
    | "phone_verified"
    | "admin_update"
    | "admin_status_change";
  metadata?: Record<string, unknown>;
  deviceInfo?: IDeviceSnapshot;
  ipAddress?: string;
  timestamp: Date;
}

const DeviceSnapshotSchema = new Schema<IDeviceSnapshot>({
  userAgent: String,
  ip: String,
  deviceType: String,
  browser: String,
  os: String,
  location: String,
}, { _id: false });

const ProfileActivitySchema = new Schema<IProfileActivity>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  userId: { type: String, required: true },
  action: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  deviceInfo: { type: DeviceSnapshotSchema },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// TTL: auto-delete after 90 days
ProfileActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
ProfileActivitySchema.index({ userId: 1, timestamp: -1 });
ProfileActivitySchema.index({ action: 1 });

export const ProfileActivity = mongoose.models.ProfileActivity ?? mongoose.model<IProfileActivity>("ProfileActivity", ProfileActivitySchema);
