export interface Task {
  id?: string;
  taskNo: string;
  task: string;
  assignedTo: string;
  delegatedBy: string;
  status: string;
  priority: string;
  dueDate: string;
  finalStatus: string;
}

export const statusOptions: string[] = [
  "All",
  "Open",
  "In Progress",
  "Pending",
  "Hold",
  "Paused",
  "Postponed",
  "Closed",
  "Verified",
  "Recurring",
  "Unverified",
];

export const pageSizeOptions: number[] = [4, 10, 20, 50];
