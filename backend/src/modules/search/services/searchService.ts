// @ts-nocheck
import { connectDB } from "../../../db/connection.js";
import { Task, Project, User, Team } from "../../../models/index.js";

export interface SearchResult {
  tasks: Array<Record<string, unknown> & { type: "task" }>;
  projects: Array<Record<string, unknown> & { type: "project" }>;
  users: Array<Record<string, unknown> & { type: "user" }>;
  teams: Array<Record<string, unknown> & { type: "team" }>;
}

export const searchService = {
  async globalSearch(
    organizationId: string,
    query: string,
    pagination: { page: number; limit: number },
  ): Promise<SearchResult> {
    await connectDB();
    const take = Math.ceil(pagination.limit / 4);
    const skip = (pagination.page - 1) * pagination.limit;

    // Use MongoDB text search with scores, fallback to regex for partial matches
    const [tasks, projects, users, teams] = await Promise.all([
      Task.find(
        {
          organizationId,
          deletedAt: null,
          $or: [
            { $text: { $search: query } },
            { title: { $regex: query, $options: "i" } },
            { taskNo: { $regex: query, $options: "i" } },
          ],
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .select("title status priority taskNo")
        .lean(),

      Project.find(
        {
          organizationId,
          deletedAt: null,
          $or: [
            { $text: { $search: query } },
            { name: { $regex: query, $options: "i" } },
          ],
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
        .skip(skip)
        .limit(take)
        .select("name status")
        .lean(),

      User.find(
        {
          organizationId,
          deletedAt: null,
          $or: [
            { $text: { $search: query } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(take)
        .select("email firstName lastName avatarUrl")
        .lean(),

      Team.find(
        {
          organizationId,
          deletedAt: null,
          $or: [
            { $text: { $search: query } },
            { name: { $regex: query, $options: "i" } },
          ],
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(take)
        .select("name")
        .lean(),
    ]);

    return {
      tasks: tasks.map((t: Record<string, unknown>) => ({ ...t, type: "task" as const })),
      projects: projects.map((p: Record<string, unknown>) => ({ ...p, type: "project" as const })),
      users: users.map((u: Record<string, unknown>) => ({ ...u, type: "user" as const })),
      teams: teams.map((t: Record<string, unknown>) => ({ ...t, type: "team" as const })),
    };
  },
};
