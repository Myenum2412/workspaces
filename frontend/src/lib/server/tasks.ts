import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import type { Task, TaskStats } from "@/types";

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

function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  return cookies()
    .then((cookieStore) => {
      const token = cookieStore.get("access_token")?.value;
      return token ? { Cookie: `access_token=${token}` } : undefined;
    })
    .catch(() => undefined);
}

export const getAllTasks = cache(async (organizationId?: string): Promise<Task[]> => {
  try {
    const headers = await getAuthHeaders();
    const q = organizationId ? `?organizationId=${organizationId}` : "";

    const res = await fetch(`${API_BASE_URL}/api/tasks${q}`, {
      headers,
      next: { revalidate: 30, tags: ["tasks"] },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return (json.tasks ?? []).map(mapTask);
  } catch {
    return [];
  }
});

export const getTaskStats = cache(async (organizationId?: string): Promise<TaskStats> => {
  const tasks = await getAllTasks(organizationId);
  return computeTaskStats(tasks);
});

export const getTaskById = cache(async (id: string): Promise<Task | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      headers,
      next: { revalidate: 30, tags: [`task-${id}`] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return mapTask(json.task);
  } catch {
    return null;
  }
});
