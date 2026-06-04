import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Workspace } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";

export const workspaceService = {
  async list(organizationId: string, params: { page: number; limit: number; search?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (params.search) filter.$or = [{ name: { $regex: params.search, $options: "i" } }, { description: { $regex: params.search, $options: "i" } }];
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [workspaces, total] = await Promise.all([Workspace.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(), Workspace.countDocuments(filter)]);
    return { workspaces, total };
  },

  async getById(id: string, organizationId: string) {
    await connectDB();
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace");
    const [memberCount, projectCount, taskCount] = await Promise.all([
      (await import("../../../models/index.js")).OrgMember.countDocuments({ workspaceId: id, deletedAt: null }),
      (await import("../../../models/index.js")).Project.countDocuments({ workspaceId: id, deletedAt: null }),
      (await import("../../../models/index.js")).Task.countDocuments({ workspaceId: id, deletedAt: null }),
    ]);
    return { ...ws, _count: { members: memberCount, projects: projectCount, tasks: taskCount } };
  },

  async create(organizationId: string, createdBy: string, data: { name: string; description?: string }) {
    await connectDB();
    const existing = await Workspace.findOne({ name: data.name, organizationId, deletedAt: null }).lean();
    if (existing) throw new ConflictError("Workspace name already exists");
    const ws = new Workspace({ _id: crypto.randomUUID(), organizationId, name: data.name, description: data.description || "", createdBy });
    await ws.save();
    return ws.toObject();
  },

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await connectDB();
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace");
    const updated = await Workspace.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return updated;
  },

  async delete(id: string, organizationId: string) {
    await connectDB();
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace");
    await Workspace.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
