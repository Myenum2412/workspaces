/**
 * Profile change history — tracks field-level diffs on every profile update.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IProfileChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface IProfileHistory extends Document<string> {
  userId: string;
  changes: IProfileChange[];
  modifiedBy: string | null; // null = system, userId = self or admin
  modifiedByEmail?: string;
  profileVersion: number;
  reason?: string;
  createdAt: Date;
}

const ProfileChangeSchema = new Schema<IProfileChange>({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
}, { _id: false });

const ProfileHistorySchema = new Schema<IProfileHistory>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  userId: { type: String, required: true },
  changes: { type: [ProfileChangeSchema], default: [] },
  modifiedBy: { type: String, default: null },
  modifiedByEmail: { type: String },
  profileVersion: { type: Number, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

ProfileHistorySchema.index({ userId: 1, createdAt: -1 });
ProfileHistorySchema.index({ profileVersion: 1 });

export const ProfileHistory = mongoose.models.ProfileHistory ?? mongoose.model<IProfileHistory>("ProfileHistory", ProfileHistorySchema);
