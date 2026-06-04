import { api } from "@/lib/api/client";
import type { Task, TaskStats, PaginatedResult } from "@/types/shared";

function mapTask(doc: Record<string, unknown>): Task {
  return {
    id: (doc._id ?? doc.id ?? "") as string,
    organizationId: (doc.organizationId ?? "") as string,
    workspaceId: (doc.workspaceId ?? "") as string,
    taskNo: (doc.taskNo ?? "") as string,
    title: (doc.title ?? doc.task ?? "") as string,
    description: (doc.description ?? "") as string,
    assignedType: (doc.assignedType as Task["assignedType"]) ?? "member",
    assignedTo: (doc.assignedTo ?? "") as string,
    assignedBy: (doc.assignedBy ?? doc.delegatedBy ?? "") as string,
    status: (doc.status as Task["status"]) ?? "pending",
    priority: (doc.priority as Task["priority"]) ?? "medium",
    startDate: (doc.startDate ?? "") as string,
    dueDate: (doc.dueDate ?? "") as string,
    completedAt: (doc.completedAt ?? "") as string,
    reviewedBy: (doc.reviewedBy ?? "") as string,
    reviewNotes: (doc.reviewNotes ?? "") as string,
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    createdBy: (doc.createdBy ?? "") as string,
    createdAt: doc.createdAt as string,
    updatedAt: doc.updatedAt as string,
    deletedAt: (doc.deletedAt as string) ?? null,
    projectId: (doc.projectId ?? null) as string | null,
  };
}

function computeTaskStats(tasks: Task[]): TaskStats {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.reduce<TaskStats>(
    (stats, task) => {
      if (task.dueDate?.startsWith(today)) stats.todayTask += 1;
      if (task.status === "in_progress") stats.inProgressTask += 1;
      if (task.status === "pending") stats.pendingTask += 1;
      if (task.status === "on_hold") stats.postponedTask += 1;
      if (
        task.dueDate &&
        task.dueDate < today &&
        !["completed", "rejected"].includes(task.status)
      ) {
        stats.overdueTask += 1;
      }
      return stats;
    },
    {
      todayTask: 0,
      inProgressTask: 0,
      teamTask: 0,
      pendingTask: 0,
      postponedTask: 0,
      repeatedTask: 0,
      overdueTask: 0,
    },
  );
}

export const taskService = {
  async getAllTasks(organizationId?: string): Promise<Task[]> {
    try {
      const q = organizationId ? `?organizationId=${organizationId}` : "";
      const res = api.get<{ success: boolean; data: Record<string, unknown>[] }>(
        `/api/tasks${q}`,
      );
      const result = await res;
      return (result.data ?? []).map(mapTask);
    } catch (error) {
      console.warn("taskService.getAllTasks error:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<Task> {
    const res = await api.get<{ success: boolean; data: Record<string, unknown> }>(
      `/api/tasks/${id}`,
    );
    return mapTask(res.data);
  },

  async createTask(data: Partial<Task>, organizationId?: string): Promise<Task> {
    const shortId = String(Date.now()).slice(-6);
    const res = await api.post<{ success: boolean; data: Record<string, unknown> }>(
      "/api/tasks",
      {
        taskNo: `TK${shortId}`,
        title: data.title ?? "Untitled Task",
        assignedTo: data.assignedTo ?? "",
        assignedBy: data.assignedBy ?? "",
        status: data.status ?? "pending",
        priority: data.priority ?? "medium",
        dueDate: data.dueDate ?? "",
        organizationId: organizationId ?? "",
      },
    );
    return mapTask(res.data);
  },

  async updateTaskStatus(taskId: string, newStatus: Task["status"]): Promise<void> {
    await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
  },

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const res = await api.put<{ success: boolean; data: Record<string, unknown> }>(
      `/api/tasks/${taskId}`,
      data,
    );
    return mapTask(res.data);
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/api/tasks/${taskId}`);
  },

  async getMyTasks(assignedTo: string): Promise<Task[]> {
    try {
      const res = await api.get<{ success: boolean; data: Record<string, unknown>[] }>(
        `/api/tasks?assignedTo=${assignedTo}`,
      );
      return (res.data ?? []).map(mapTask);
    } catch {
      return [];
    }
  },

  async getMyTaskStats(assignedTo: string): Promise<TaskStats> {
    const tasks = await this.getMyTasks(assignedTo);
    return computeTaskStats(tasks);
  },

  async getTaskStats(organizationId?: string): Promise<TaskStats> {
    const tasks = await this.getAllTasks(organizationId);
    return computeTaskStats(tasks);
  },
};

export type { Task, TaskStats };
