import { databases, Query, ID, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import type { TaskDoc } from "@/lib/appwrite/types";

export interface UITask {
  id: string;
  taskNo: string;
  task: string;
  assignedTo: string;
  delegatedBy: string;
  delegatedStatus: string;
  delegationVerification: string;
  status: string;
  priority: string;
  dueDate: string;
  taskVerificationStatus: string;
  finalStatus: string;
}

export interface TaskStats {
  todayTask: number;
  inProgressTask: number;
  teamTask: number;
  pendingTask: number;
  postponedTask: number;
  repeatedTask: number;
  overdueTask: number;
}

function docToTask(doc: TaskDoc): UITask {
  return {
    id: doc.$id,
    taskNo: doc.taskNo,
    task: doc.task,
    assignedTo: doc.assignedTo,
    delegatedBy: doc.delegatedBy,
    delegatedStatus: doc.delegatedStatus,
    delegationVerification: doc.delegationVerification,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate,
    taskVerificationStatus: doc.taskVerificationStatus,
    finalStatus: doc.finalStatus,
  };
}

export const taskService = {
  async getAllTasks(organizationId?: string): Promise<UITask[]> {
    try {
      const queries: any[] = [Query.limit(500)];
      if (organizationId) queries.push(Query.equal("organizationId", organizationId));
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.TASKS, queries);
      return (res.documents as unknown as TaskDoc[]).map(docToTask);
    } catch (error) {
      console.warn("taskService.getAllTasks error:", error);
      return [];
    }
  },

  async getTaskById(id: string): Promise<UITask> {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.TASKS, id);
    return docToTask(doc as unknown as TaskDoc);
  },

  async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    await databases.updateDocument(DB_ID, COLLECTIONS.TASKS, taskId, {
      status: newStatus,
      finalStatus: newStatus,
    });
  },

  async createTask(taskData: Partial<UITask>, organizationId?: string): Promise<UITask> {
    const now = new Date().toISOString();
    const shortId = String(Date.now()).slice(-6);
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.TASKS, ID.unique(), {
      taskNo: `TK${shortId}`,
      task: taskData.task ?? "Untitled Task",
      assignedTo: taskData.assignedTo ?? "Unassigned",
      delegatedBy: taskData.delegatedBy ?? "Admin",
      delegatedStatus: taskData.delegatedStatus ?? "Open",
      delegationVerification: "Verified",
      status: taskData.status ?? "Open",
      priority: taskData.priority ?? "Medium",
      dueDate: taskData.dueDate ?? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
      taskVerificationStatus: "Pending",
      finalStatus: taskData.status ?? "Open",
      organizationId: organizationId ?? "",
    });
    return docToTask(doc as unknown as TaskDoc);
  },

  async updateTask(taskId: string, taskData: Partial<UITask>): Promise<UITask> {
    const doc = await databases.updateDocument(DB_ID, COLLECTIONS.TASKS, taskId, taskData);
    return docToTask(doc as unknown as TaskDoc);
  },

  async getMyTasks(assignedTo: string): Promise<UITask[]> {
    try {
      const queries: any[] = [Query.equal("assignedTo", assignedTo), Query.limit(500)];
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.TASKS, queries);
      return (res.documents as unknown as TaskDoc[]).map(docToTask);
    } catch (error) {
      console.warn("taskService.getMyTasks error:", error);
      return [];
    }
  },

  async getMyTaskStats(assignedTo: string): Promise<TaskStats> {
    const tasks = await this.getMyTasks(assignedTo);
    const today = new Date().toISOString().slice(0, 10);

    return tasks.reduce<TaskStats>((stats, task) => {
      if (task.dueDate === today) stats.todayTask += 1;
      if (task.status.toLowerCase() === "in progress") stats.inProgressTask += 1;
      if (task.status.toLowerCase() === "pending") stats.pendingTask += 1;
      if (task.status.toLowerCase() === "hold") stats.postponedTask += 1;
      if (task.status === "Recurring" || task.status.toLowerCase() === "recurring") stats.repeatedTask += 1;
      if (task.dueDate !== "Recurring") {
        try {
          const dueParts = task.dueDate.split("-");
          if (dueParts.length === 3) {
            const due = new Date(`${dueParts[2]}-${dueParts[1]}-${dueParts[0]}`);
            if (!isNaN(due.getTime()) && due.toISOString().slice(0, 10) < today
              && !["completed", "closed", "verified"].includes(task.status.toLowerCase())) {
              stats.overdueTask += 1;
            }
          }
        } catch { /* skip */ }
      }
      return stats;
    }, {
      todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0,
      postponedTask: 0, repeatedTask: 0, overdueTask: 0,
    });
  },

  async getTaskStats(organizationId?: string): Promise<TaskStats> {
    const tasks = await this.getAllTasks(organizationId);
    const today = new Date().toISOString().slice(0, 10);

    return tasks.reduce<TaskStats>((stats, task) => {
      if (task.dueDate === today) stats.todayTask += 1;
      if (task.status.toLowerCase() === "in progress") stats.inProgressTask += 1;
      if (task.status.toLowerCase() === "pending") stats.pendingTask += 1;
      if (task.status.toLowerCase() === "hold") stats.postponedTask += 1;
      if (task.status === "Recurring" || task.status.toLowerCase() === "recurring") stats.repeatedTask += 1;
      if (task.dueDate !== "Recurring") {
        try {
          const dueParts = task.dueDate.split("-");
          if (dueParts.length === 3) {
            const due = new Date(`${dueParts[2]}-${dueParts[1]}-${dueParts[0]}`);
            if (!isNaN(due.getTime()) && due.toISOString().slice(0, 10) < today
              && !["completed", "closed", "verified"].includes(task.status.toLowerCase())) {
              stats.overdueTask += 1;
            }
          }
        } catch { /* skip */ }
      }
      return stats;
    }, {
      todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0,
      postponedTask: 0, repeatedTask: 0, overdueTask: 0,
    });
  },
};
