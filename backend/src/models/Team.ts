import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeam {
  _id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  description: string;
  headUserId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ITeamDocument extends ITeam, Document<string> {}

const TeamSchema = new Schema<ITeamDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  headUserId: { type: String, default: null },
  status: { type: String, default: "active" },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

TeamSchema.index({ organizationId: 1, name: "text" });

export const Team: Model<ITeamDocument> =
  mongoose.models.Team || mongoose.model<ITeamDocument>("Team", TeamSchema);
