import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkspace {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  status: string;
  settings: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IWorkspaceDocument extends IWorkspace, Document<string> {}

const WorkspaceSchema = new Schema<IWorkspaceDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, default: "active" },
  settings: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: String, required: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

export const Workspace: Model<IWorkspaceDocument> =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspaceDocument>("Workspace", WorkspaceSchema);
