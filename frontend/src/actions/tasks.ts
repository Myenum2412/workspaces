"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "./errors";
import type { Task } from "@/types";

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    return token ? { Cookie: `access_token=${token}` } : {};
  } catch {
    return {};
  }
}

async function getCsrfHeaders(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: "GET",
      cache: "no-store",
    });
    const cookieHeader = res.headers.get("set-cookie");
    const match = cookieHeader?.match(/csrf_token=([^;]+)/);
    if (match) {
      return { "X-CSRF-Token": decodeURIComponent(match[1]) };
    }
  } catch { /* ignore */ }
  return {};
}

export async function createTaskAction(formData: FormData) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const shortId = String(Date.now()).slice(-6);
  const body = {
    taskNo: `TK${shortId}`,
    task: (formData.get("task") as string) || "Untitled Task",
    assignedTo: (formData.get("assignedTo") as string) || "Unassigned",
    delegatedBy: (formData.get("delegatedBy") as string) || "Admin",
    status: (formData.get("status") as string) || "Open",
    priority: (formData.get("priority") as string) || "Medium",
    dueDate: (formData.get("dueDate") as string) || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
    finalStatus: (formData.get("status") as string) || "Open",
    organizationId: (formData.get("organizationId") as string) || "",
  };

  const res = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to create task", res.status);
  }

  revalidateTag("tasks", "default");
  const json = await res.json();
  return mapTask(json.task);
}

export async function updateTaskAction(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  if (!taskId) throw new ApiError("Task ID required", 400);

  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const body: Record<string, unknown> = {};
  const fields = ["task", "assignedTo", "delegatedBy", "status", "priority", "dueDate", "finalStatus", "organizationId"];
  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null && value !== undefined) body[field] = value;
  }

  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to update task", res.status);
  }

  revalidateTag("tasks", "default");
  revalidateTag(`task-${taskId}`, "default");
  const json = await res.json();
  return mapTask(json.task);
}

export async function updateTaskStatusAction(taskId: string, newStatus: string) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ status: newStatus, finalStatus: newStatus }),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to update status", res.status);
  }

  revalidateTag("tasks", "default");
  revalidateTag(`task-${taskId}`, "default");
}

export async function deleteTaskAction(taskId: string) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to delete task", res.status);
  }

  revalidateTag("tasks", "default");
}
