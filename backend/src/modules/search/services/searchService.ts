import { connectDB } from "../../../db/connection.js";
import { Task, Project, User, Team } from "../../../models/index.js";

export const searchService = {
  async globalSearch(organizationId: string, query: string, params: { page: number; limit: number }) {
    await connectDB();
    const regex = { $regex: query, $options: "i" };
    const take = Math.ceil(params.limit / 4);
    const skip = (params.page - 1) * params.limit;

    const [tasks, projects, users, teams] = await Promise.all([
      Task.find({ organizationId, deletedAt: null, $or: [{ title: regex }, { description: regex }] }).sort({ updatedAt: -1 }).skip(skip).limit(take).select("title status priority taskNo").lean(),
      Project.find({ organizationId, deletedAt: null, $or: [{ name: regex }, { description: regex }] }).sort({ updatedAt: -1 }).skip(skip).limit(take).select("name status").lean(),
      User.find({ organizationId, deletedAt: null, $or: [{ email: regex }, { firstName: regex }, { lastName: regex }] }).skip(skip).limit(take).select("email firstName lastName avatarUrl").lean(),
      Team.find({ organizationId, deletedAt: null, name: regex }).skip(skip).limit(take).select("name").lean(),
    ]);

    return {
      tasks: tasks.map((t: Record<string, unknown>) => ({ ...t, type: "task" })),
      projects: projects.map((p: Record<string, unknown>) => ({ ...p, type: "project" })),
      users: users.map((u: Record<string, unknown>) => ({ ...u, type: "user" })),
      teams: teams.map((t: Record<string, unknown>) => ({ ...t, type: "team" })),
    };
  },
};
