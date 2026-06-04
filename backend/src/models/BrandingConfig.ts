import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrandingConfig {
  _id: string;
  organizationId: string;
  colors: Record<string, unknown>;
  darkModeColors: Record<string, unknown>;
  typography: Record<string, unknown>;
  logo: Record<string, unknown>;
  favicon: string;
  mode: string;
  presetName: string;
  version: number;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandingConfigDocument extends IBrandingConfig, Document<string> {}

const BrandingConfigSchema = new Schema<IBrandingConfigDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, unique: true, index: true },
  colors: { type: Schema.Types.Mixed, default: {} },
  darkModeColors: { type: Schema.Types.Mixed, default: {} },
  typography: { type: Schema.Types.Mixed, default: {} },
  logo: { type: Schema.Types.Mixed, default: {} },
  favicon: { type: String, default: "" },
  mode: { type: String, enum: ["light", "dark", "system"], default: "light" },
  presetName: { type: String, default: "emerald" },
  version: { type: Number, default: 1 },
  updatedBy: { type: String, default: null },
}, { timestamps: true });

export const BrandingConfig: Model<IBrandingConfigDocument> =
  mongoose.models.BrandingConfig ||
  mongoose.model<IBrandingConfigDocument>("BrandingConfig", BrandingConfigSchema);
