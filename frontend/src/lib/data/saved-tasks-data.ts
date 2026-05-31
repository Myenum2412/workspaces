/**
 * Saved task templates — via backend REST API.
 */

import { api } from "@/lib/api/client";
import type { SavedTask } from "@/types";

export type { SavedTask };

function mapSavedTask(doc: any): SavedTask {
  return {
    id: doc._id ?? doc.id ?? "",
    title: doc.title ?? "",
    description: doc.description ?? "",
    priority: doc.priority ?? "",
    taskType: doc.taskType ?? "",
    assignedType: doc.assignedType ?? "",
    estimatedTime: doc.estimatedTime ?? "",
    templateCategory: doc.templateCategory ?? "",
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    deletedAt: doc.deletedAt,
  };
}

export async function getSavedTasks(organizationId?: string): Promise<SavedTask[]> {
  try {
    const q = organizationId ? `?organizationId=${organizationId}` : "";
    const res = await api.get<{ success: boolean; savedTasks: any[] }>(`/api/tasks/saved${q}`);
    return (res.savedTasks ?? []).map(mapSavedTask);
  } catch (error) {
    console.warn("getSavedTasks error:", error);
    return [];
  }
}
