/**
 * Audit log and activity log query service for admin panels.
 */
import { connectDB } from "../config/connection.js";
import { AuditLog, ActivityLog } from "../models/openwa.js";

export const AuditQueryService = {
  async getAuditLogs(params: {
    organizationId: string;
    page: number;
    limit: number;
    action?: string;
    severity?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }) {
    await connectDB();
    const { organizationId, page, limit, action, severity, userId, fromDate, toDate, search } = params;
    const filter: Record<string, any> = { organizationId };

    if (action) filter.action = action;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { path: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getActivityLogs(params: {
    organizationId: string;
    page: number;
    limit: number;
    userId?: string;
    action?: string;
    entityType?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    await connectDB();
    const { organizationId, page, limit, userId, action, entityType, fromDate, toDate } = params;
    const filter: Record<string, any> = { organizationId };

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getAuditActions(organizationId: string): Promise<string[]> {
    await connectDB();
    const actions = await AuditLog.distinct("action", { organizationId });
    return actions.filter(Boolean).sort();
  },

  async getAuditStats(organizationId: string) {
    await connectDB();
    const [total, bySeverity, byAction] = await Promise.all([
      AuditLog.countDocuments({ organizationId }),
      AuditLog.aggregate([
        { $match: { organizationId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: { organizationId } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return {
      total,
      bySeverity: Object.fromEntries(bySeverity.map((s: any) => [s._id, s.count])),
      topActions: byAction.map((a: any) => ({ action: a._id, count: a.count })),
    };
  },
};
