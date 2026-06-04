// @ts-nocheck
import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Workspace } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";
import { getAllowedSortField } from "../../../types/shared.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  PaginationParams,
  PaginatedResult,
} from "../../../types/shared.js";

export const workspaceService = {
  async list(
    organizationId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (pagination.search) {
      filter.$or = [
        { name: { $regex: pagination.search, $options: "i" } },
        { description: { $regex: pagination.search, $options: "i" } },
      ];
    }
    const sortField = getAllowedSortField("workspaces", pagination.sortBy);
    const sort: Record<string, 1 | -1> = { [sortField]: pagination.sortOrder === "asc" ? 1 : -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [workspaces, total] = await Promise.all([
      Workspace.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Workspace.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: workspaces,
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
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace", id);
    const OrgMember = (await import("../../../models/index.js")).OrgMember;
    const Project = (await import("../../../models/index.js")).Project;
    const Task = (await import("../../../models/index.js")).Task;
    const [memberCount, projectCount, taskCount] = await Promise.all([
      OrgMember.countDocuments({ workspaceId: id, deletedAt: null }),
      Project.countDocuments({ workspaceId: id, deletedAt: null }),
      Task.countDocuments({ workspaceId: id, deletedAt: null }),
    ]);
    return { ...ws, _count: { members: memberCount, projects: projectCount, tasks: taskCount } };
  },

  async create(
    organizationId: string,
    createdBy: string,
    data: CreateWorkspaceInput,
  ): Promise<Record<string, unknown>> {
    await connectDB();
    const existing = await Workspace.findOne({
      name: data.name,
      organizationId,
      deletedAt: null,
    }).lean();
    if (existing) throw new ConflictError("Workspace name already exists");
    const ws = new Workspace({
      _id: crypto.randomUUID(),
      organizationId,
      name: data.name,
      description: data.description || "",
      createdBy,
    });
    await ws.save();
    return ws.toObject();
  },

  async update(
    id: string,
    organizationId: string,
    data: UpdateWorkspaceInput,
  ): Promise<Record<string, unknown> | null> {
    await connectDB();
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace", id);
    const updated = await Workspace.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return updated;
  },

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const ws = await Workspace.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!ws) throw new NotFoundError("Workspace", id);
    await Workspace.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
