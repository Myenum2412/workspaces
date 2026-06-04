import { connectDB } from "../../../db/connection.js";
import { Task, Project, User } from "../../../models/index.js";

function toCsvRow(values: string[]): string {
  return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
}

export const exportService = {
  async exportTasks(organizationId: string, workspaceId: string | null, format: "csv" | "json") {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    const tasks = await Task.find(filter).sort({ createdAt: -1 }).populate("assignedTo", "firstName lastName email").populate("projectId", "name").lean();
    if (format === "json") return JSON.stringify(tasks, null, 2);
    const headers = ["Task No", "Title", "Status", "Priority", "Assigned To", "Project", "Due Date", "Created At"];
    const rows = tasks.map((t: Record<string, unknown>) => {
      const assignee = t.assignedTo as Record<string, unknown> | null;
      const project = t.projectId as Record<string, unknown> | null;
      return toCsvRow([t.taskNo as string, t.title as string, t.status as string, t.priority as string, assignee ? `${assignee.firstName} ${assignee.lastName}` : "", project?.name as string || "", t.dueDate ? new Date(t.dueDate as string).toISOString() : "", t.createdAt ? new Date(t.createdAt as string).toISOString() : ""]);
    });
    return [toCsvRow(headers), ...rows].join("\n");
  },

  async exportProjects(organizationId: string, workspaceId: string | null, format: "csv" | "json") {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
    if (format === "json") return JSON.stringify(projects, null, 2);
    const headers = ["Name", "Status", "Start Date", "End Date", "Created At"];
    const rows = projects.map((p: Record<string, unknown>) => toCsvRow([p.name as string, p.status as string, p.startDate ? new Date(p.startDate as string).toISOString() : "", p.endDate ? new Date(p.endDate as string).toISOString() : "", p.createdAt ? new Date(p.createdAt as string).toISOString() : ""]));
    return [toCsvRow(headers), ...rows].join("\n");
  },

  async exportUsers(organizationId: string, format: "csv" | "json") {
    await connectDB();
    const users = await User.find({ organizationId, deletedAt: null }).sort({ createdAt: -1 }).lean();
    if (format === "json") return JSON.stringify(users, null, 2);
    const headers = ["Email", "First Name", "Last Name", "Role", "Status", "Email Verified", "Last Login", "Created At"];
    const rows = users.map((u: Record<string, unknown>) => toCsvRow([u.email as string, u.firstName as string, u.lastName as string, u.role as string, u.status as string, String(u.emailVerified), u.lastLoginAt ? new Date(u.lastLoginAt as string).toISOString() : "", u.createdAt ? new Date(u.createdAt as string).toISOString() : ""]));
    return [toCsvRow(headers), ...rows].join("\n");
  },
};
