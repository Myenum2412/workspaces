// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISetting {
  _id: string;
  organizationId: string;
  key: string;
  value: Record<string, unknown>;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingDocument extends ISetting, Document<string> {}

const SettingSchema = new Schema<ISettingDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: Schema.Types.Mixed },
  updatedBy: { type: String, default: null },
}, { timestamps: true });

SettingSchema.index({ organizationId: 1, key: 1 }, { unique: true });

export const Setting: Model<ISettingDocument> =
  mongoose.models.Setting || mongoose.model<ISettingDocument>("Setting", SettingSchema);
