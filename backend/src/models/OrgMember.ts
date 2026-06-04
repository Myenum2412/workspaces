import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrgMember {
  _id: string;
  organizationId: string;
  workspaceId: string | null;
  userId: string;
  role: string;
  status: string;
  invitedBy: string;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface IOrgMemberDocument extends IOrgMember, Document<string> {}

const OrgMemberSchema = new Schema<IOrgMemberDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null, index: true },
  userId: { type: String, required: true },
  role: {
    type: String,
    enum: ["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"],
    default: "MEMBER",
  },
  status: { type: String, default: "active" },
  invitedBy: { type: String, default: "" },
  joinedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

OrgMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrgMember: Model<IOrgMemberDocument> =
  mongoose.models.OrgMember ||
  mongoose.model<IOrgMemberDocument>("OrgMember", OrgMemberSchema);
