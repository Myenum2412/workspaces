import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Task, User, Project } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";

export const taskService = {
  async list(organizationId: string, workspaceId: string | null, params: { page: number; limit: number; search?: string; status?: string; priority?: string; assignedTo?: string; projectId?: string; sortBy: string; sortOrder: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (params.search) filter.$or = [{ title: { $regex: params.search, $options: "i" } }, { description: { $regex: params.search, $options: "i" } }];
    if (params.status) filter.status = params.status;
    if (params.priority) filter.priority = params.priority;
    if (params.assignedTo) filter.assignedTo = params.assignedTo;
    if (params.projectId) filter.projectId = params.projectId;
    const sort: Record<string, 1 | -1> = { [params.sortBy]: params.sortOrder === "asc" ? 1 : -1 };
    const [tasks, total] = await Promise.all([Task.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(), Task.countDocuments(filter)]);
    return { tasks, total };
  },

  async getById(id: string, organizationId: string) {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task");
    return task;
  },

  async generateTaskNo(workspaceId: string): Promise<string> {
    await connectDB();
    const count = await Task.countDocuments({ workspaceId });
    return `TASK-${String(count + 1).padStart(5, "0")}`;
  },

  async create(organizationId: string, workspaceId: string, assignedBy: string, data: { title: string; description?: string; assignedTo?: string; assignedType?: string; projectId?: string; priority?: string; startDate?: string; dueDate?: string; tags?: string[] }) {
    await connectDB();
    const taskNo = await this.generateTaskNo(workspaceId);
    const task = new Task({
      _id: crypto.randomUUID(), organizationId, workspaceId, projectId: data.projectId || null,
      taskNo, title: data.title, description: data.description || "",
      assignedTo: data.assignedTo || null, assignedType: data.assignedType || "member",
      assignedBy, priority: data.priority || "medium",
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null, tags: data.tags || [],
    });
    await task.save();
    return task.toObject();
  },

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task");
    if (data.status === "completed") data.completedAt = new Date();
    return Task.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  },

  async delete(id: string, organizationId: string) {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task");
    await Task.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
