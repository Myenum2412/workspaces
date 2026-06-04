// @ts-nocheck
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject {
  _id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  description: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IProjectDocument extends IProject, Document<string> {}

const ProjectSchema = new Schema<IProjectDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["planning", "active", "on_hold", "completed", "archived"],
    default: "planning",
  },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  createdBy: { type: String, required: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

ProjectSchema.index({ organizationId: 1, name: "text", description: "text" });

export const Project: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);
