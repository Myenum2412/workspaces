// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordReset {
  _id: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IPasswordResetDocument extends IPasswordReset, Document<string> {}

const PasswordResetSchema = new Schema<IPasswordResetDocument>({
  _id: { type: String },
  email: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset: Model<IPasswordResetDocument> =
  mongoose.models.PasswordReset ||
  mongoose.model<IPasswordResetDocument>("PasswordReset", PasswordResetSchema);
