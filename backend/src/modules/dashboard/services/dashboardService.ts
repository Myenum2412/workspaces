import { connectDB } from "../../../db/connection.js";
import { Task, Project, Team, OrgMember, ActivityLog } from "../../../models/index.js";
import { cacheGet, cacheSet, cacheKey } from "../../../core/utils/cache.js";

const DASHBOARD_CACHE_TTL = 60; // 1 minute for dashboard stats

export const dashboardService = {
  async getStats(organizationId: string, workspaceId: string | null) {
    await connectDB();

    const cacheK = cacheKey("dashboard", "stats", organizationId, workspaceId ?? "all");
    const cached = await cacheGet<Record<string, unknown>>(cacheK);
    if (cached) return cached;

    const base: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) base.workspaceId = workspaceId;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      totalProjects,
      projectsByStatus,
      totalTeams,
      totalUsers,
      recentActivities,
      overdueTasks,
      completedThisMonth,
    ] = await Promise.all([
      Task.countDocuments(base),
      Task.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: base }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Project.countDocuments(base),
      Project.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Team.countDocuments(base),
      OrgMember.countDocuments({ organizationId, status: "active", deletedAt: null }),
      ActivityLog.find({ organizationId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "firstName lastName avatarUrl")
        .lean(),
      Task.countDocuments({
        ...base,
        dueDate: { $lt: now },
        status: { $nin: ["completed", "rejected"] },
      }),
      Task.countDocuments({
        ...base,
        status: "completed",
        completedAt: { $gte: monthStart },
      }),
    ]);

    const result = {
      overview: {
        totalTasks,
        totalProjects,
        totalTeams,
        totalUsers,
        overdueTasks,
        completedThisMonth,
      },
      tasksByStatus: Object.fromEntries(tasksByStatus.map((t: { _id: string; count: number }) => [t._id, t.count])),
      tasksByPriority: Object.fromEntries(tasksByPriority.map((t: { _id: string; count: number }) => [t._id, t.count])),
      projectsByStatus: Object.fromEntries(projectsByStatus.map((p: { _id: string; count: number }) => [p._id, p.count])),
      recentActivities,
    };

    await cacheSet(cacheK, result, DASHBOARD_CACHE_TTL);
    return result;
  },

  async getMyTasks(userId: string, organizationId: string) {
    await connectDB();

    const cacheK = cacheKey("dashboard", "mytasks", userId, organizationId);
    const cached = await cacheGet<Record<string, unknown>>(cacheK);
    if (cached) return cached;

    const base: Record<string, unknown> = { organizationId, deletedAt: null };
    const now = new Date();
    const [assigned, created, completed, overdue] = await Promise.all([
      Task.countDocuments({ ...base, assignedTo: userId, status: { $ne: "completed" } }),
      Task.countDocuments({ ...base, assignedBy: userId }),
      Task.countDocuments({ ...base, assignedTo: userId, status: "completed" }),
      Task.countDocuments({
        ...base,
        assignedTo: userId,
        dueDate: { $lt: now },
        status: { $nin: ["completed", "rejected"] },
      }),
    ]);

    const result = { assigned, created, completed, overdue };
    await cacheSet(cacheK, result, DASHBOARD_CACHE_TTL);
    return result;
  },
};
