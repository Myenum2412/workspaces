// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  category: string;
  companyRange: string;
  email: string;
  ownerEmail: string;
  ownerId: string;
  logoUrl: string;
  industry: string;
  size: string;
  status: string;
  settings: Record<string, unknown>;
  hrSettings: Record<string, unknown>;
  themeSettings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IOrganizationDocument extends IOrganization, Document<string> {}

const OrganizationSchema = new Schema<IOrganizationDocument>({
  _id: { type: String },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: "" },
  companyRange: { type: String, default: "" },
  email: { type: String, default: "" },
  ownerEmail: { type: String, default: "" },
  ownerId: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  industry: { type: String, default: "" },
  size: { type: String, default: "" },
  status: { type: String, enum: ["active", "suspended", "archived"], default: "active" },
  settings: { type: Schema.Types.Mixed, default: {} },
  hrSettings: { type: Schema.Types.Mixed, default: {} },
  themeSettings: { type: Schema.Types.Mixed, default: {} },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

OrganizationSchema.index({ status: 1 });

export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);
