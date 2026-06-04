import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamMember {
  _id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMemberDocument extends ITeamMember, Document<string> {}

const TeamMemberSchema = new Schema<ITeamMemberDocument>({
  _id: { type: String },
  teamId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["LEADER", "MEMBER"], default: "MEMBER" },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export const TeamMember: Model<ITeamMemberDocument> =
  mongoose.models.TeamMember || mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);
