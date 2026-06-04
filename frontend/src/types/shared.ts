// ═══════════════════════════════════════════════════════════════
// Shared Types — Frontend
// Synchronized with backend/src/types/shared.ts
// ═══════════════════════════════════════════════════════════════

// ── Enums ─────────────────────────────────────────────────────

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  WORKSPACE_MANAGER: "WORKSPACE_MANAGER",
  MEMBER: "MEMBER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
  terminated: "terminated",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const TaskStatus = {
  pending: "pending",
  assigned: "assigned",
  in_progress: "in_progress",
  under_review: "under_review",
  completed: "completed",
  rejected: "rejected",
  on_hold: "on_hold",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const ProjectStatus = {
  planning: "planning",
  active: "active",
  on_hold: "on_hold",
  completed: "completed",
  archived: "archived",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

// ── Role Hierarchy ────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1,
  WORKSPACE_MANAGER: 3,
  ORG_ADMIN: 4,
  SUPER_ADMIN: 5,
};

// ── Pagination ────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── API Response ──────────────────────────────────────────────

export interface ApiResponseMeta {
  requestId?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    reference?: string;
  };
  meta: ApiResponseMeta;
}

// ── Auth Types ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  role: string;
  status: string;
  emailVerified: boolean;
  organizationId?: string;
  workspaceId?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  organization: Organization | null;
  membership: {
    role: string;
    organizationId: string;
    workspaceId?: string | null;
  } | null;
}

// ── Organization ──────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  category: string;
  companyRange: string;
  email: string;
  ownerEmail: string;
  ownerId: string;
  logoUrl: string;
  industry: string;
  size: string;
  status: string;
  hrSettings: Record<string, unknown>;
  themeSettings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── User / Employee ───────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Task ──────────────────────────────────────────────────────

export interface Task {
  id: string;
  organizationId: string;
  workspaceId: string;
  projectId: string | null;
  taskNo: string;
  title: string;
  description: string;
  assignedTo: string | null;
  assignedType: "member" | "team";
  assignedBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── Project ───────────────────────────────────────────────────

export interface Project {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── Team ──────────────────────────────────────────────────────

export interface Team {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  description: string;
  headUserId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── Workspace ─────────────────────────────────────────────────

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ── File ──────────────────────────────────────────────────────

export interface FileRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
  folder: string;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

// ── Stats ─────────────────────────────────────────────────────

export interface TaskStats {
  todayTask: number;
  inProgressTask: number;
  teamTask: number;
  pendingTask: number;
  postponedTask: number;
  repeatedTask: number;
  overdueTask: number;
  totalTask?: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeNow: number;
  onLeave: number;
  assignedTasks: number;
}
