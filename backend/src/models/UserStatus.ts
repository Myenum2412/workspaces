// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrgInvitation {
  _id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IOrgInvitationDocument extends IOrgInvitation, Document<string> {}

const OrgInvitationSchema = new Schema<IOrgInvitationDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"],
    default: "MEMBER",
  },
  invitedBy: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "expired", "revoked"],
    default: "pending",
  },
  expiresAt: { type: Date, required: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

export const OrgInvitation: Model<IOrgInvitationDocument> =
  mongoose.models.OrgInvitation ||
  mongoose.model<IOrgInvitationDocument>("OrgInvitation", OrgInvitationSchema);

// ── User Status ────────────────────────────────────────────────

export interface IUserStatus {
  _id: string;
  userId: string;
  status: string;
  lastActiveAt: Date | null;
  updatedAt: Date;
}

export interface IUserStatusDocument extends IUserStatus, Document<string> {}

const UserStatusSchema = new Schema<IUserStatusDocument>({
  _id: { type: String },
  userId: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: "Offline" },
  lastActiveAt: { type: Date, default: null },
}, { timestamps: true });

export const UserStatus: Model<IUserStatusDocument> =
  mongoose.models.UserStatus ||
  mongoose.model<IUserStatusDocument>("UserStatus", UserStatusSchema);

// ── User Status History ────────────────────────────────────────

export interface IUserStatusHistory {
  _id: string;
  userId: string;
  status: string;
  loginTimestamp: Date;
  logoutTimestamp: Date | null;
  lastActiveTime: Date | null;
  durations: Array<{
    status: string;
    startedAt: Date;
    endedAt: Date;
    durationSeconds: number;
  }>;
  createdAt: Date;
}

export interface IUserStatusHistoryDocument extends IUserStatusHistory, Document<string> {}

const UserStatusHistorySchema = new Schema<IUserStatusHistoryDocument>({
  _id: { type: String },
  userId: { type: String, required: true, index: true },
  status: { type: String, default: "Online" },
  loginTimestamp: { type: Date, default: Date.now },
  logoutTimestamp: { type: Date, default: null },
  lastActiveTime: { type: Date, default: null },
  durations: [
    {
      status: { type: String },
      startedAt: { type: Date },
      endedAt: { type: Date },
      durationSeconds: { type: Number },
    },
  ],
}, { timestamps: true });

export const UserStatusHistory: Model<IUserStatusHistoryDocument> =
  mongoose.models.UserStatusHistory ||
  mongoose.model<IUserStatusHistoryDocument>("UserStatusHistory", UserStatusHistorySchema);
