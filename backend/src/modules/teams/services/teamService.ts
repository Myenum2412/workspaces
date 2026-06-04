import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Team, TeamMember, User } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";

export const teamService = {
  async list(organizationId: string, workspaceId: string | null, params: { page: number; limit: number; search?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (params.search) filter.name = { $regex: params.search, $options: "i" };
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [teams, total] = await Promise.all([Team.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(), Team.countDocuments(filter)]);
    return { teams, total };
  },

  async getById(id: string, organizationId: string) {
    await connectDB();
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team");
    const members = await TeamMember.find({ teamId: id }).populate({ path: "userId", model: User, select: "email firstName lastName avatarUrl" }).lean();
    return { ...team, members };
  },

  async create(organizationId: string, workspaceId: string, data: { name: string; description?: string; headUserId?: string }) {
    await connectDB();
    const existing = await Team.findOne({ name: data.name, workspaceId, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Team name already exists in this workspace");
    const team = new Team({ _id: crypto.randomUUID(), organizationId, workspaceId, name: data.name, description: data.description || "", headUserId: headUserId || null });
    await team.save();
    return team.toObject();
  },

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await connectDB();
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team");
    return Team.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },

  async delete(id: string, organizationId: string) {
    await connectDB();
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team");
    await Team.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },

  async addMember(teamId: string, userId: string, role: string = "MEMBER") {
    await connectDB();
    const existing = await TeamMember.findOne({ teamId, userId }).lean();
    if (existing) throw new ConflictError("User already in team");
    const member = new TeamMember({ _id: crypto.randomUUID(), teamId, userId, role });
    await member.save();
    return member.toObject();
  },

  async removeMember(teamId: string, userId: string) {
    await connectDB();
    const member = await TeamMember.findOne({ teamId, userId }).lean();
    if (!member) throw new NotFoundError("Team member");
    await TeamMember.findByIdAndDelete(member._id);
    return { removed: true };
  },
};
