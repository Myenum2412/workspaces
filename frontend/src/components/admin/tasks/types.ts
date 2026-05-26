// TypeScript interfaces for Tasks Table

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "delegated" | "cancelled" | "postponed";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type AssigneeType = "staff" | "team";

export interface Staff {
  id: string;
  name: string;
  email?: string;
  profile_image_url?: string;
}

// Team type is imported from @/types/team (matches backend structure)

export interface Delegation {
  id: string;
  delegated_by_staff_id: string;
  delegated_by_staff_name: string;
  delegated_to_staff_id: string;
  delegated_to_staff_name: string;
  reason?: string;
  created_at: string;
}

export interface Reschedule {
  id: string;
  staff_id: string;
  staff?: Staff;
  reason: string;
  requested_date: string;
  status: "pending" | "approved" | "rejected";
  admin_response?: string;
  created_at: string;
}

export interface Proof {
  id: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  verified: boolean;
}

export interface Task {
  id: string;
  taskNumber?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  notes?: string;

  // Assignment info
  assigned_to_staff_id?: string;
  assigned_to_team_id?: string;
  assignee_type?: AssigneeType;
  // Computed names from backend associations (for display when maps unavailable)
  assigned_to_staff_name?: string;
  assigned_to_team_name?: string;
  branch_name?: string;

  // Creator info
  created_by_admin_id?: string;
  created_by_staff_id?: string;
  created_by_staff?: Staff;
  created_at: string;

  // Task features
  is_repeated?: boolean;
  repeat_frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "custom" | string;
  repeat_interval?: number;
  custom_repeat_interval_days?: number | null;
  next_repetition_date?: string;

  // Child tasks (for repeated tasks)
  child_tasks?: number;
  parent_task_id?: string;

  // Visibility toggle (admin/tasks table)
  is_visible?: boolean;


  // Delegations
  has_delegations?: boolean;
  delegated_by_staff_name?: string;
  delegations?: Delegation[];
  delegationVerificationStatus?: 'Not delegated' | 'Pending' | 'Verified';
  delegator?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;

  // Reschedules
  has_pending_reschedule?: boolean;
  has_approved_reschedule?: boolean;
  pending_reschedule?: Reschedule;
  latest_approved_reschedule?: Reschedule;

  // Proofs/Verification
  proofs?: Proof[];
  pending_proofs?: number;
  taskVerificationStatus?: 'Pending' | 'Verified';

  // Computed field for display (added during preprocessing)
  assignedName?: string;

  // Attachments
  attachments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    downloadUrl?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;

  // Allocations (for team tasks)
  allocations?: Array<{
    id: string;
    taskId: string;
    assignedType: 'User' | 'Team';
    assignedToId: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
    completedAt?: string | null;
    completedBy?: string | null;
    assignee?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    };
    completer?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
    } | null;
  }>;
}

export interface TaskAssignment {
  task: Task;
  assignee: string;
  assigneeName: string;
  assigneeImage?: string;
  type: AssigneeType;
}

// Modal props types
export interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export interface DeleteTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (taskId: string) => void;
}

export interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

