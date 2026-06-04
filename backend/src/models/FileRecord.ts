import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFileRecord {
  _id: string;
  organizationId: string;
  workspaceId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
  folder: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export interface IFileRecordDocument extends IFileRecord, Document<string> {}

const FileRecordSchema = new Schema<IFileRecordDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  key: { type: String, required: true },
  folder: { type: String, default: "general", index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

FileRecordSchema.index({ organizationId: 1, folder: 1 });

export const FileRecord: Model<IFileRecordDocument> =
  mongoose.models.FileRecord || mongoose.model<IFileRecordDocument>("FileRecord", FileRecordSchema);
