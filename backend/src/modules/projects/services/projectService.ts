import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Project, ProjectMember, Task } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

export const projectService = {
  async list(organizationId: string, workspaceId: string | null, params: { page: number; limit: number; search?: string; status?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (params.search) filter.name = { $regex: params.search, $options: "i" };
    if (params.status) filter.status = params.status;
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [projects, total] = await Promise.all([Project.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(), Project.countDocuments(filter)]);
    return { projects, total };
  },

  async getById(id: string, organizationId: string) {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project");
    const members = await ProjectMember.find({ projectId: id }).populate("userId", "email firstName lastName avatarUrl").lean();
    const taskCount = await Task.countDocuments({ projectId: id, deletedAt: null });
    return { ...project, members, _count: { tasks: taskCount } };
  },

  async create(organizationId: string, workspaceId: string, createdBy: string, data: { name: string; description?: string; startDate?: string; endDate?: string }) {
    await connectDB();
    const projectId = crypto.randomUUID();
    const project = new Project({ _id: projectId, organizationId, workspaceId, name: data.name, description: data.description || "", createdBy, startDate: data.startDate ? new Date(data.startDate) : null, endDate: data.endDate ? new Date(data.endDate) : null });
    const member = new ProjectMember({ _id: crypto.randomUUID(), projectId, userId: createdBy, role: "OWNER" });
    await Promise.all([project.save(), member.save()]);
    return project.toObject();
  },

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project");
    return Project.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },

  async delete(id: string, organizationId: string) {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project");
    await Project.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
