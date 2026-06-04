import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Project } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";
import { getAllowedSortField } from "../../../types/shared.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  PaginationParams,
  PaginatedResult,
} from "../../../types/shared.js";

export const projectService = {
  async list(
    organizationId: string,
    workspaceId: string | null,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (pagination.search) {
      filter.$or = [
        { name: { $regex: pagination.search, $options: "i" } },
        { description: { $regex: pagination.search, $options: "i" } },
      ];
    }
    const sortField = getAllowedSortField("projects", pagination.sortBy);
    const sort: Record<string, 1 | -1> = { [sortField]: pagination.sortOrder === "asc" ? 1 : -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Project.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: projects,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },

  async getById(id: string, organizationId: string): Promise<Record<string, unknown>> {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project", id);
    return project;
  },

  async create(
    organizationId: string,
    workspaceId: string,
    createdBy: string,
    data: CreateProjectInput,
  ): Promise<Record<string, unknown>> {
    await connectDB();
    const existing = await Project.findOne({
      name: data.name,
      organizationId,
      deletedAt: null,
    }).lean();
    if (existing) throw new ConflictError("Project name already exists");
    const project = new Project({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceId,
      name: data.name,
      description: data.description || "",
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdBy,
    });
    await project.save();
    return project.toObject();
  },

  async update(
    id: string,
    organizationId: string,
    data: UpdateProjectInput,
  ): Promise<Record<string, unknown> | null> {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project", id);
    const updated = await Project.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return updated;
  },

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const project = await Project.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!project) throw new NotFoundError("Project", id);
    await Project.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
