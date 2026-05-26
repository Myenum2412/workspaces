import { databases, Query, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import type { SavedTaskDoc } from "@/lib/appwrite/types";

export interface SavedTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  taskType: string;
  assignedType: string;
  estimatedTime: string;
  createdAt: string;
  templateCategory: string;
}

function docToTask(doc: SavedTaskDoc): SavedTask {
  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    taskType: doc.taskType,
    assignedType: doc.assignedType,
    estimatedTime: doc.estimatedTime,
    createdAt: doc.$createdAt ?? "",
    templateCategory: doc.templateCategory,
  };
}

let cachedTasks: SavedTask[] | null = null;

export async function getSavedTasks(organizationId?: string): Promise<SavedTask[]> {
  if (cachedTasks) return cachedTasks;
  try {
    const queries: any[] = [Query.limit(500)];
    if (organizationId) queries.push(Query.equal("organizationId", organizationId));
    const res = await databases.listDocuments(DB_ID, COLLECTIONS.SAVED_TASKS, queries);
    cachedTasks = (res.documents as unknown as SavedTaskDoc[]).map(docToTask);
    return cachedTasks;
  } catch (error) {
    console.warn("getSavedTasks error:", error);
    return [];
  }
}

export function clearSavedTasksCache(): void {
  cachedTasks = null;
}
