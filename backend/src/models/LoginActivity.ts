import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoginActivity {
  _id: string;
  userId: string;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: string;
  failureReason: string | null;
  createdAt: Date;
}

export interface ILoginActivityDocument extends ILoginActivity, Document<string> {}

const LoginActivitySchema = new Schema<ILoginActivityDocument>({
  _id: { type: String },
  userId: { type: String, required: true },
  email: { type: String, required: true },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  status: { type: String, enum: ["success", "failed"], required: true },
  failureReason: { type: String, default: null },
}, { timestamps: true });

LoginActivitySchema.index({ userId: 1, createdAt: -1 });

export const LoginActivity: Model<ILoginActivityDocument> =
  mongoose.models.LoginActivity || mongoose.model<ILoginActivityDocument>("LoginActivity", LoginActivitySchema);
