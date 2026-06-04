import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  loginCount: number;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IUserDocument extends IUser, Document<string> {}

const UserSchema = new Schema<IUserDocument>({
  _id: { type: String, default: () => new Types.ObjectId().toString() },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"],
    default: "MEMBER",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "terminated"],
    default: "active",
  },
  emailVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null, select: false },
  loginCount: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ status: 1 });
UserSchema.index({ organizationId: 1, email: 1 });
UserSchema.index({ organizationId: 1, firstName: "text", lastName: "text", email: "text" });

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
