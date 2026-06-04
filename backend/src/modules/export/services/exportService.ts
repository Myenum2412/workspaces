import { connectDB } from "../../../db/connection.js";
import { Task, Project, User } from "../../../models/index.js";

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  // Prevent CSV injection: prefix formula-triggering characters with a single quote
  const sanitized = str.replace(/^[=+\-@]/, "'$&");
  // Escape double quotes and wrap in quotes
  return `"${sanitized.replace(/"/g, '""')}"`;
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsvValue).join(",");
}

export const exportService = {
  async exportTasks(
    organizationId: string,
    workspaceId: string | null,
    format: "csv" | "json",
  ): Promise<string> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "firstName lastName email")
      .populate("projectId", "name")
      .lean();

    if (format === "json") return JSON.stringify(tasks, null, 2);

    const headers = [
      "Task No",
      "Title",
      "Status",
      "Priority",
      "Assigned To",
      "Project",
      "Due Date",
      "Created At",
    ];
    const rows = tasks.map((t: Record<string, unknown>) => {
      const assignee = t.assignedTo as Record<string, unknown> | null;
      const project = t.projectId as Record<string, unknown> | null;
      return toCsvRow([
        t.taskNo,
        t.title,
        t.status,
        t.priority,
        assignee ? `${assignee.firstName} ${assignee.lastName}` : "",
        project?.name ?? "",
        t.dueDate ? new Date(t.dueDate as string).toISOString() : "",
        t.createdAt ? new Date(t.createdAt as string).toISOString() : "",
      ]);
    });
    return [toCsvRow(headers), ...rows].join("\n");
  },

  async exportProjects(
    organizationId: string,
    workspaceId: string | null,
    format: "csv" | "json",
  ): Promise<string> {
    await connectDB();
    const filter: Record<string, unknown> = { organizationId, deletedAt: null };
    if (workspaceId) filter.workspaceId = workspaceId;
    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();

    if (format === "json") return JSON.stringify(projects, null, 2);

    const headers = ["Name", "Status", "Start Date", "End Date", "Created At"];
    const rows = projects.map((p: Record<string, unknown>) =>
      toCsvRow([
        p.name,
        p.status,
        p.startDate ? new Date(p.startDate as string).toISOString() : "",
        p.endDate ? new Date(p.endDate as string).toISOString() : "",
        p.createdAt ? new Date(p.createdAt as string).toISOString() : "",
      ]),
    );
    return [toCsvRow(headers), ...rows].join("\n");
  },

  async exportUsers(
    organizationId: string,
    format: "csv" | "json",
  ): Promise<string> {
    await connectDB();
    const users = await User.find({ organizationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();

    if (format === "json") return JSON.stringify(users, null, 2);

    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Role",
      "Status",
      "Email Verified",
      "Last Login",
      "Created At",
    ];
    const rows = users.map((u: Record<string, unknown>) =>
      toCsvRow([
        u.email,
        u.firstName,
        u.lastName,
        u.role,
        u.status,
        String(u.emailVerified),
        u.lastLoginAt ? new Date(u.lastLoginAt as string).toISOString() : "",
        u.createdAt ? new Date(u.createdAt as string).toISOString() : "",
      ]),
    );
    return [toCsvRow(headers), ...rows].join("\n");
  },
};
