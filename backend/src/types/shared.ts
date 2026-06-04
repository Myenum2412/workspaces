// ═══════════════════════════════════════════════════════════════
// Shared DTOs and Types — Backend
// These types define the contract between layers (controller → service → model)
// and should be synchronized with frontend/src/types/shared.ts
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

export const MemberRole = {
  ORG_ADMIN: "ORG_ADMIN",
  WORKSPACE_MANAGER: "WORKSPACE_MANAGER",
  MEMBER: "MEMBER",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

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

export const InvitationStatus = {
  pending: "pending",
  accepted: "accepted",
  expired: "expired",
  revoked: "revoked",
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export const OrgStatus = {
  active: "active",
  suspended: "suspended",
  archived: "archived",
} as const;
export type OrgStatus = (typeof OrgStatus)[keyof typeof OrgStatus];

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

// ── Auth DTOs ─────────────────────────────────────────────────

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  category?: string;
  companyRange?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  organizationId: string;
  workspaceId: string | null;
  role: string;
  tokenId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
}

export interface Setup2FAResult {
  secret: string;
  qrCode: string;
}

export interface Verify2FAInput {
  token: string;
}

export interface Disable2FAInput {
  password: string;
}

// ── User DTOs ─────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  workspaceId?: string;
  designation?: string;
  department?: string;
  phone?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  designation?: string;
  department?: string;
  status?: string;
}

export interface UserProfileOutput {
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

// ── Task DTOs ─────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignedTo?: string | null;
  assignedType?: "member" | "team";
  projectId?: string | null;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assignedTo?: string | null;
  assignedType?: "member" | "team";
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string;
  tags?: string[];
}

export interface TaskListFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  projectId?: string;
}

export interface TaskOutput {
  id: string;
  organizationId: string;
  workspaceId: string;
  projectId: string | null;
  taskNo: string;
  title: string;
  description: string;
  assignedTo: string | null;
  assignedType: string;
  assignedBy: string;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Project DTOs ──────────────────────────────────────────────

export interface CreateProjectInput {
  name: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
}

// ── Team DTOs ─────────────────────────────────────────────────

export interface CreateTeamInput {
  name: string;
  description?: string;
  headUserId?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  headUserId?: string | null;
  status?: string;
}

// ── Workspace DTOs ────────────────────────────────────────────

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  status?: "active" | "archived";
}

// ── File DTOs ─────────────────────────────────────────────────

export interface FileUploadResult {
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

// ── Notification DTOs ─────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ── Activity DTOs ─────────────────────────────────────────────

export interface LogActivityInput {
  organizationId: string;
  workspaceId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ── Allowed Sort Fields (prevent injection) ───────────────────

export const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
  tasks: ["createdAt", "updatedAt", "dueDate", "priority", "status", "title", "taskNo"],
  users: ["createdAt", "updatedAt", "email", "firstName", "lastName", "lastLoginAt"],
  projects: ["createdAt", "updatedAt", "name", "status", "startDate", "endDate"],
  teams: ["createdAt", "updatedAt", "name"],
  workspaces: ["createdAt", "updatedAt", "name"],
  files: ["createdAt", "updatedAt", "filename", "size", "folder"],
  notifications: ["createdAt", "read"],
  activity: ["createdAt"],
};

export function getAllowedSortField(entity: string, requestedField: string): string {
  const allowed = ALLOWED_SORT_FIELDS[entity] || ["createdAt"];
  return allowed.includes(requestedField) ? requestedField : "createdAt";
}
