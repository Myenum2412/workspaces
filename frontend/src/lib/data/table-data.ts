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

export const pageSizeOptions = [4, 10, 20, 50];
export const statusOptions = ["All", "Open", "Hold", "Closed", "Recurring", "Paused"];
