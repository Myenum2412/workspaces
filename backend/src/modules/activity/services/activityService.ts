import crypto from "crypto";
import { connectDB } from "../../../db/connection.js";
import { ActivityLog, AuditLog } from "../../../models/index.js";

export const activityService = {
  async log(data: { organizationId: string; workspaceId?: string; userId?: string; action: string; entityType: string; entityId: string; metadata?: Record<string, unknown>; ipAddress?: string; userAgent?: string }) {
    await connectDB();
    const log = new ActivityLog({ _id: crypto.randomUUID(), organizationId: data.organizationId, workspaceId: data.workspaceId || null, userId: data.userId || null, action: data.action, entityType: data.entityType, entityId: data.entityId, metadata: data.metadata || {}, ipAddress: data.ipAddress || null, userAgent: data.userAgent || null });
    await log.save();
    return log.toObject();
  },

  async list(organizationId: string, params: { page: number; limit: number; userId?: string; entityType?: string; action?: string; fromDate?: string; toDate?: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId };
    if (params.userId) filter.userId = params.userId;
    if (params.entityType) filter.entityType = params.entityType;
    if (params.action) filter.action = params.action;
    if (params.fromDate || params.toDate) filter.createdAt = { ...(params.fromDate && { $gte: new Date(params.fromDate) }), ...(params.toDate && { $lte: new Date(params.toDate) }) };
    const [activities, total] = await Promise.all([ActivityLog.find(filter).sort({ createdAt: -1 }).skip((params.page - 1) * params.limit).limit(params.limit).populate("userId", "email firstName lastName avatarUrl").lean(), ActivityLog.countDocuments(filter)]);
    return { activities, total };
  },

  async auditLog(data: { organizationId: string; action: string; severity?: string; userId?: string; userEmail?: string; ipAddress?: string; userAgent?: string; method?: string; path?: string; statusCode?: number; metadata?: Record<string, unknown>; errorMessage?: string }) {
    await connectDB();
    const log = new AuditLog({ _id: crypto.randomUUID(), organizationId: data.organizationId, action: data.action, severity: data.severity || "info", userId: data.userId || null, userEmail: data.userEmail || null, ipAddress: data.ipAddress || null, userAgent: data.userAgent || null, method: data.method || null, path: data.path || null, statusCode: data.statusCode || null, metadata: data.metadata || {}, errorMessage: data.errorMessage || null });
    await log.save();
    return log.toObject();
  },

  async listAuditLogs(organizationId: string, params: { page: number; limit: number; severity?: string; action?: string }) {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId };
    if (params.severity) filter.severity = params.severity;
    if (params.action) filter.action = params.action;
    const [logs, total] = await Promise.all([AuditLog.find(filter).sort({ createdAt: -1 }).skip((params.page - 1) * params.limit).limit(params.limit).lean(), AuditLog.countDocuments(filter)]);
    return { logs, total };
  },
};
