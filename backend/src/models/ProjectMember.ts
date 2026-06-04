import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectMember {
  _id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectMemberDocument extends IProjectMember, Document<string> {}

const ProjectMemberSchema = new Schema<IProjectMemberDocument>({
  _id: { type: String },
  projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["OWNER", "MANAGER", "CONTRIBUTOR", "VIEWER"], default: "CONTRIBUTOR" },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectMember: Model<IProjectMemberDocument> =
  mongoose.models.ProjectMember || mongoose.model<IProjectMemberDocument>("ProjectMember", ProjectMemberSchema);
