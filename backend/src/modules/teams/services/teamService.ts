// @ts-nocheck
import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { Team } from "../../../models/index.js";
import { NotFoundError, ConflictError } from "../../../core/errors/AppError.js";
import { getAllowedSortField } from "../../../types/shared.js";
import type { CreateTeamInput, UpdateTeamInput, PaginationParams, PaginatedResult } from "../../../types/shared.js";

export const teamService = {
  async list(
    organizationId: string,
    workspaceId: string | null,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (pagination.search) {
      filter.name = { $regex: pagination.search, $options: "i" };
    }
    const sortField = getAllowedSortField("teams", pagination.sortBy);
    const sort: Record<string, 1 | -1> = { [sortField]: pagination.sortOrder === "asc" ? 1 : -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [teams, total] = await Promise.all([
      Team.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Team.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: teams,
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
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team", id);
    return team;
  },

  async create(
    organizationId: string,
    workspaceId: string,
    data: CreateTeamInput,
  ): Promise<Record<string, unknown>> {
    await connectDB();
    const existing = await Team.findOne({
      name: data.name,
      organizationId,
      deletedAt: null,
    }).lean();
    if (existing) throw new ConflictError("Team name already exists");
    const team = new Team({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceId,
      name: data.name,
      description: data.description || "",
      headUserId: data.headUserId || null,
    });
    await team.save();
    return team.toObject();
  },

  async update(
    id: string,
    organizationId: string,
    data: UpdateTeamInput,
  ): Promise<Record<string, unknown> | null> {
    await connectDB();
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team", id);
    const updated = await Team.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return updated;
  },

  async remove(id: string, organizationId: string): Promise<{ deleted: boolean }> {
    await connectDB();
    const team = await Team.findOne({ _id: id, organizationId, deletedAt: null }).lean();
    if (!team) throw new NotFoundError("Team", id);
    await Team.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    return { deleted: true };
  },
};
