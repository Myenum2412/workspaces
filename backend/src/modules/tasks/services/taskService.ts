import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Task } from "../../../models/index.js";
import { NotFoundError } from "../../../core/errors/AppError.js";
import { getAllowedSortField } from "../../../types/shared.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskListFilters,
  TaskOutput,
  PaginationParams,
  PaginatedResult,
} from "../../../types/shared.js";

export const taskService = {
  async list(
    organizationId: string,
    workspaceId: string | null,
    pagination: PaginationParams,
    filters: TaskListFilters,
  ): Promise<PaginatedResult<TaskOutput>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (filters.status) filter.status = filters.status;
    if (filters.priority) filter.priority = filters.priority;
    if (filters.assignedTo) filter.assignedTo = filters.assignedTo;
    if (filters.projectId) filter.projectId = filters.projectId;

    if (pagination.search) {
      filter.$or = [
        { title: { $regex: pagination.search, $options: "i" } },
        { description: { $regex: pagination.search, $options: "i" } },
      ];
    }

    const sortField = getAllowedSortField("tasks", pagination.sortBy);
    const sort: Record<string, 1 | -1> = {
      [sortField]: pagination.sortOrder === "asc" ? 1 : -1,
    };

    const skip = (pagination.page - 1) * pagination.limit;
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Task.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / pagination.limit);
    return {
      data: tasks as TaskOutput[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },

  async getById(id: string, organizationId: string): Promise<TaskOutput> {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task", id);
    return task as TaskOutput;
  },

  async generateTaskNo(workspaceId: string): Promise<string> {
    await connectDB();
    const count = await Task.countDocuments({ workspaceId });
    return `TASK-${String(count + 1).padStart(5, "0")}`;
  },

  async create(
    organizationId: string,
    workspaceId: string,
    assignedBy: string,
    data: CreateTaskInput,
  ): Promise<TaskOutput> {
    await connectDB();
    const taskNo = await this.generateTaskNo(workspaceId);
    const task = new Task({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceId,
      projectId: data.projectId || null,
      taskNo,
      title: data.title,
      description: data.description || "",
      assignedTo: data.assignedTo || null,
      assignedType: data.assignedType || "member",
      assignedBy,
      priority: data.priority || "medium",
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      tags: data.tags || [],
    });
    await task.save();
    return task.toObject() as TaskOutput;
  },

  async update(id: string, organizationId: string, data: UpdateTaskInput): Promise<TaskOutput | null> {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task", id);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "completed") {
      updateData.completedAt = new Date();
    }

    const updated = await Task.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    return updated as TaskOutput | null;
  },

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const task = await Task.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!task) throw new NotFoundError("Task", id);
    await Task.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
