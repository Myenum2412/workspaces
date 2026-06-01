/**
 * Branding change history — tracks every branding update for audit + rollback.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IBrandingChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface IBrandingHistory extends Document<string> {
  organizationId: string;
  version: number;
  changes: IBrandingChange[];
  snapshot: Record<string, any>;  // Full branding config at this point
  updatedBy: string;
  updatedByName: string;
  rollbackFrom: number | null;   // Version this was rolled back from
  createdAt: Date;
}

const BrandingChangeSchema = new Schema<IBrandingChange>({
  field: { type: String, required: true },
  oldValue: { type: String, required: true },
  newValue: { type: String, required: true },
}, { _id: false });

const BrandingHistorySchema = new Schema<IBrandingHistory>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  changes: { type: [BrandingChangeSchema], default: [] },
  snapshot: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: String, required: true },
  updatedByName: { type: String, default: "" },
  rollbackFrom: { type: Number, default: null },
}, { timestamps: true });

// Compound index for fast version lookups per org
BrandingHistorySchema.index({ organizationId: 1, version: -1 });

export const BrandingHistory = mongoose.models.BrandingHistory ?? mongoose.model<IBrandingHistory>("BrandingHistory", BrandingHistorySchema);
