/**
 * Task service — CRUD for tasks via backend REST API.
 * Replaces AppWrite databases.* calls.
 */

import { api } from "@/lib/api/client";
import type { Task, TaskStats } from "@/types";

export type { Task, TaskStats };

function mapTask(doc: any): Task {
  return {
    id: doc._id ?? doc.id,
    taskNo: doc.taskNo ?? "",
    task: doc.task ?? "",
    assignedTo: doc.assignedTo ?? "",
    delegatedBy: doc.delegatedBy ?? "",
    status: doc.status ?? "",
    priority: doc.priority ?? "",
    dueDate: doc.dueDate ?? "",
    finalStatus: doc.finalStatus ?? "",
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  };
}

export const taskService = {
  async getAllTasks(organizationId?: string): Promise<Task[]> {
    try {
      const q = organizationId ? `?organizationId=${organizationId}` : "";
      const res = await api.get<{ success: boolean; tasks: any[] }>(`/api/tasks${q}`);
      return (res.tasks ?? []).map(mapTask);
    } catch (error) {
      console.warn("taskService.getAllTasks error:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<Task> {
    const res = await api.get<{ success: boolean; task: any }>(`/api/tasks/${id}`);
    return mapTask(res.task);
  },

  async createTask(data: Partial<Task>, organizationId?: string): Promise<Task> {
    const shortId = String(Date.now()).slice(-6);
    const res = await api.post<{ success: boolean; task: any }>("/api/tasks", {
      taskNo: `TK${shortId}`,
      task: data.task ?? "Untitled Task",
      assignedTo: data.assignedTo ?? "Unassigned",
      delegatedBy: data.delegatedBy ?? "Admin",
      status: data.status ?? "Open",
      priority: data.priority ?? "Medium",
      dueDate: data.dueDate ?? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
      finalStatus: data.status ?? "Open",
      organizationId: organizationId ?? "",
    });
    return mapTask(res.task);
  },

  async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    await api.patch(`/api/tasks/${taskId}`, { status: newStatus, finalStatus: newStatus });
  },

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const res = await api.put<{ success: boolean; task: any }>(`/api/tasks/${taskId}`, data);
    return mapTask(res.task);
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/api/tasks/${taskId}`);
  },

  async getMyTasks(assignedTo: string): Promise<Task[]> {
    try {
      const res = await api.get<{ success: boolean; tasks: any[] }>(`/api/tasks?assignedTo=${assignedTo}`);
      return (res.tasks ?? []).map(mapTask);
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

function computeTaskStats(tasks: Task[]): TaskStats {
  const today = new Date().toISOString().slice(0, 10);
  return tasks.reduce<TaskStats>(
    (stats, task) => {
      if (task.dueDate === today) stats.todayTask += 1;
      if (task.status.toLowerCase() === "in progress") stats.inProgressTask += 1;
      if (task.status.toLowerCase() === "pending") stats.pendingTask += 1;
      if (task.status.toLowerCase() === "hold") stats.postponedTask += 1;
      if (task.status === "Recurring" || task.status.toLowerCase() === "recurring") stats.repeatedTask += 1;
      if (task.dueDate !== "Recurring") {
        try {
          const parts = task.dueDate.split("-");
          if (parts.length === 3) {
            const due = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (!isNaN(due.getTime()) && due.toISOString().slice(0, 10) < today
              && !["completed", "closed", "verified"].includes(task.status.toLowerCase())) {
              stats.overdueTask += 1;
            }
          }
        } catch { /* skip */ }
      }
      return stats;
    },
    { todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0, postponedTask: 0, repeatedTask: 0, overdueTask: 0 }
  );
}
