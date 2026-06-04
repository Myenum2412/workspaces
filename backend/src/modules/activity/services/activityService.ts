import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { ActivityLog, AuditLog } from "../../../models/index.js";
import type { LogActivityInput, PaginationParams, PaginatedResult } from "../../../types/shared.js";

export const activityService = {
  async log(data: LogActivityInput): Promise<Record<string, unknown>> {
    await connectDB();
    const log = new ActivityLog({
      _id: crypto.randomUUID(),
      organizationId: data.organizationId,
      workspaceId: data.workspaceId || null,
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
    await log.save();
    return log.toObject();
  },

  async list(
    organizationId: string,
    pagination: PaginationParams,
    filters: { userId?: string; entityType?: string; action?: string; fromDate?: string; toDate?: string },
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId };
    if (filters.userId) filter.userId = filters.userId;
    if (filters.entityType) filter.entityType = filters.entityType;
    if (filters.action) filter.action = filters.action;
    if (filters.fromDate || filters.toDate) {
      filter.createdAt = {
        ...(filters.fromDate && { $gte: new Date(filters.fromDate) }),
        ...(filters.toDate && { $lte: new Date(filters.toDate) }),
      };
    }
    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .populate("userId", "email firstName lastName avatarUrl")
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: activities,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },

  async auditLog(data: {
    organizationId: string;
    action: string;
    severity?: string;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    metadata?: Record<string, unknown>;
    errorMessage?: string;
  }): Promise<Record<string, unknown>> {
    await connectDB();
    const log = new AuditLog({
      _id: crypto.randomUUID(),
      organizationId: data.organizationId,
      action: data.action,
      severity: data.severity || "info",
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      method: data.method || null,
      path: data.path || null,
      statusCode: data.statusCode || null,
      metadata: data.metadata || {},
      errorMessage: data.errorMessage || null,
    });
    await log.save();
    return log.toObject();
  },

  async listAuditLogs(
    organizationId: string,
    pagination: PaginationParams,
    filters: { severity?: string; action?: string },
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId };
    if (filters.severity) filter.severity = filters.severity;
    if (filters.action) filter.action = filters.action;
    const sort: Record<string, 1 | -1> = { createdAt: -1 };
    const skip = (pagination.page - 1) * pagination.limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(pagination.limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / pagination.limit);
    return {
      data: logs,
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages,
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1,
    };
  },
};
