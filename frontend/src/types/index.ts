export const ROLES = {
  ORG_ADMIN: "ORG_ADMIN",
  WORKSPACE_MANAGER: "WORKSPACE_MANAGER",
  MEMBER: "MEMBER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  [ROLES.MEMBER]: 1,
  [ROLES.WORKSPACE_MANAGER]: 3,
  [ROLES.ORG_ADMIN]: 4,
};

export const ROLE_DISPLAY: Record<RoleName, string> = {
  [ROLES.ORG_ADMIN]: "Organization Admin",
  [ROLES.WORKSPACE_MANAGER]: "Workspace Manager",
  [ROLES.MEMBER]: "Member",
};

export type OrgRole = "owner" | "admin" | "manager" | "staff" | "member" | "operator" | "viewer";

export type EmployeeStatus =
  | "active" | "inactive" | "suspended" | "terminated" | "archived";

export type EmploymentType =
  | "full_time" | "part_time" | "contract" | "intern" | "freelance";

export interface Organization {
  id: string;
  _id?: string;
  name: string;
  category?: string;
  companyRange?: string;
  email?: string;
  ownerEmail?: string;
  ownerId?: string;
  logoUrl?: string;
  industry?: string;
  size?: string;
  status: "active" | "suspended" | "archived";
  hrSettings?: Record<string, unknown>;
  themeSettings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  organizationId: string;
  workspaceId?: string | null;
  roleId?: string;
  role: RoleName;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  expertise?: string[];
  empId?: string;
  employmentType?: EmploymentType;
  status: EmployeeStatus;
  teamIds?: string[];
  joiningDate?: string;
  terminationDate?: string | null;
  terminationReason?: string | null;
  lastLogin?: string | null;
  loginCount?: number;
  emailVerified?: boolean;
  profileCompletion?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeNow: number;
  onLeave: number;
  assignedTasks: number;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  workspaceId?: string | null;
  userId: string;
  role: RoleName;
  status: string;
  invitedBy?: string;
  joinedAt?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export type TaskStatus =
  | "pending" | "assigned" | "in_progress" | "under_review"
  | "completed" | "rejected" | "on_hold";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskAssignType = "member" | "team";

export interface Task {
  id: string;
  organizationId: string;
  workspaceId?: string;
  taskNo: string;
  title: string;
  description?: string;
  assignedType: TaskAssignType;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  tags?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SavedTask {
  id: string;
  organizationId: string;
  workspaceId?: string;
  title: string;
  description?: string;
  priority?: string;
  taskType?: string;
  assignedType?: string;
  estimatedTime?: string;
  templateCategory?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

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

export interface Team {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  headUserId?: string;
  memberIds?: string[];
  status: "active" | "inactive" | "archived";
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Branch {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  address?: string;
  managerName?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Client {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: string;
  industry?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface MasterData {
  id: string;
  organizationId: string;
  workspaceId?: string;
  name: string;
  values: string[];
  createdAt?: string;
  deletedAt?: string | null;
}

export interface FileRecord {
  id: string;
  organizationId: string;
  workspaceId?: string;
  userId: string;
  userName?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  key: string;
  folder: string;
  createdAt?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    role: RoleName;
    organizationId?: string;
    workspaceId?: string | null;
  };
  profile?: UserProfile | null;
  organization: Organization | null;
  membership: {
    role: RoleName;
    organizationId: string;
    workspaceId?: string | null;
  } | null;
}

export interface UIEmployee extends UserProfile {
  avatar?: string | null;
  orgId?: string | null;
  joinedAt?: string | null;
  nickname?: string | null;
  category?: string | null;
  activeHours?: string | null;
  screenTime?: string | null;
  mobile?: string | null;
  workExperience?: unknown[];
  educationDetails?: unknown[];
  dependentDetails?: unknown[];
  socialLinks?: Record<string, string>;
  exitDate?: string | null;
  [key: string]: unknown;
}

export interface UserPresence {
  userId: string;
  status: "Online" | "Offline" | "Away" | "Leave";
  lastSeen?: string;
  device?: string;
  ipAddress?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
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
  };
}

export interface OrgDashboard {
  workspaces: { total: number; active: number; suspended: number };
  members: { total: number; active: number; terminated: number; statusBreakdown: Record<string, number> };
  teams: { total: number };
  projects: { total: number; active: number };
  tasks: { total: number; completed: number; inProgress: number; overdue: number; pending: number; completionRate: number };
  recentActivity: unknown[];
}

export interface WorkspaceDashboard {
  members: { total: number; active: number };
  teams: { total: number };
  projects: { total: number; active: number };
  tasks: { total: number; byStatus: Record<string, number>; overdue: number };
  topMembers: unknown[];
  recentActivity: unknown[];
  overdueTasks: Task[];
}

export interface MemberDashboard {
  user: UserProfile;
  tasks: { total: number; byStatus: Record<string, number>; overdue: number; upcoming: Task[] };
  teams: Team[];
  projects: unknown[];
  attendance?: unknown;
  notifications: { unread: number };
  recentActivity: unknown[];
}
