import mongoose, { Schema, Document } from "mongoose";

export interface IFileRecord extends Document<string> {
  organizationId: string;
  userId: string;
  userName: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
  folder: string;
  createdAt: string;
}

const FileRecordSchema = new Schema<IFileRecord>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  key: { type: String, required: true },
  folder: { type: String, required: true, index: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

FileRecordSchema.index({ organizationId: 1, folder: 1 });
FileRecordSchema.index({ organizationId: 1, createdAt: -1 });

export const FileRecord = mongoose.models.FileRecord ?? mongoose.model<IFileRecord>("FileRecord", FileRecordSchema);
