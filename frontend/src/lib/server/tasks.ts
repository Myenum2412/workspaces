import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import { mapTask, mapTasks, mapTaskStats } from "@/lib/types/mappers";
import type { Task, TaskStats } from "@/types";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  return token ? { Cookie: `access_token=${token}` } : {};
}

export const getTaskStats = cache(async (organizationId?: string): Promise<TaskStats> => {
  try {
    const headers = await getAuthHeaders();
    const q = organizationId ? `?organizationId=${organizationId}` : "";

    const res = await fetch(`${API_BASE_URL}/api/tasks/stats${q}`, {
      headers,
      next: { revalidate: 30, tags: ["task-stats"] },
    });

    if (!res.ok) {
      return { todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0, postponedTask: 0, repeatedTask: 0, overdueTask: 0, totalTask: 0 };
    }

    const json = await res.json();
    return mapTaskStats(json.data ?? json);
  } catch {
    return { todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0, postponedTask: 0, repeatedTask: 0, overdueTask: 0, totalTask: 0 };
  }
});

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
    return mapTasks(json.data ?? json.tasks ?? []);
  } catch {
    return [];
  }
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
    return mapTask(json.data ?? json.task);
  } catch {
    return null;
  }
});
