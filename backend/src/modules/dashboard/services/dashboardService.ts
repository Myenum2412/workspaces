import { connectDB } from "../../../db/connection.js";
import { Task, Project, Team, OrgMember, ActivityLog } from "../../../models/index.js";

export const dashboardService = {
  async getStats(organizationId: string, workspaceId: string | null) {
    await connectDB();
    const base: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) base.workspaceId = workspaceId;

    const [totalTasks, tasksByStatus, tasksByPriority, totalProjects, projectsByStatus, totalTeams, totalUsers, recentActivities] = await Promise.all([
      Task.countDocuments(base),
      Task.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: base }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Project.countDocuments(base),
      Project.aggregate([{ $match: base }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Team.countDocuments(base),
      OrgMember.countDocuments({ organizationId, status: "active", deletedAt: null }),
      ActivityLog.find({ organizationId }).sort({ createdAt: -1 }).limit(10).populate("userId", "firstName lastName avatarUrl").lean(),
    ]);

    const now = new Date();
    const overdueTasks = await Task.countDocuments({ ...base, dueDate: { $lt: now }, status: { $nin: ["completed", "rejected"] } });
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = await Task.countDocuments({ ...base, status: "completed", completedAt: { $gte: monthStart } });

    return {
      overview: { totalTasks, totalProjects, totalTeams, totalUsers, overdueTasks, completedThisMonth },
      tasksByStatus: Object.fromEntries(tasksByStatus.map((t) => [t._id, t.count])),
      tasksByPriority: Object.fromEntries(tasksByPriority.map((t) => [t._id, t.count])),
      projectsByStatus: Object.fromEntries(projectsByStatus.map((p) => [p._id, p.count])),
      recentActivities,
    };
  },

  async getMyTasks(userId: string, organizationId: string) {
    await connectDB();
    const base: Record<string, unknown> = { organizationId, deletedAt: null };
    const now = new Date();
    const [assigned, created, completed, overdue] = await Promise.all([
      Task.countDocuments({ ...base, assignedTo: userId, status: { $ne: "completed" } }),
      Task.countDocuments({ ...base, assignedBy: userId }),
      Task.countDocuments({ ...base, assignedTo: userId, status: "completed" }),
      Task.countDocuments({ ...base, assignedTo: userId, dueDate: { $lt: now }, status: { $nin: ["completed", "rejected"] } }),
    ]);
    return { assigned, created, completed, overdue };
  },
};
