/**
 * Shared TypeScript types for all domain entities.
 * Single source of truth — mirrors backend Mongoose schemas.
 *
 * Replaces: src/lib/appwrite/types.ts
 */

// ── Org ────────────────────────────────────────────────────────

export type OrgRole = "owner" | "admin" | "manager" | "staff" | "member" | "operator" | "viewer";
export type MemberStatus = "active" | "inactive" | "pending" | "suspended";

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
  hrSettings?: Record<string, unknown>;
  themeSettings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// ── User / Staff ───────────────────────────────────────────────

export type StaffStatus = "active" | "inactive" | "suspended" | "pending" | "removed" | "Deleted" | "Active" | "On Leave" | string;
export type EmploymentType = "Full Time" | "Part Time" | "Contract" | "Intern" | "Freelance" | string;

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  expertise?: string[];
  organizationId?: string | null;
  role?: string | null;
  status?: StaffStatus | null;
  nickname?: string | null;
  empId?: string | null;
  joiningDate?: string | null;
  mobile?: string | null;
  employmentType?: EmploymentType | null;
  currentExperience?: string | null;
  totalExperience?: string | null;
  dob?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  sourceOfHire?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  uan?: string | null;
  presentAddress?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  permanentAddress?: string | null;
  personalPhone?: string | null;
  personalEmail?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileCompletion?: number;
  lastLogin?: string;
  loginCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  status: MemberStatus;
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

export interface UIStaff extends UserProfile {
  avatar?: string | null;
  orgId?: string | null;
  joinedAt?: string | null;
  category?: string | null;
  activeHours?: string | null;
  screenTime?: string | null;
  workExperience?: unknown[];
  educationDetails?: unknown[];
  dependentDetails?: unknown[];
  socialLinks?: Record<string, string>;
  exitDate?: string | null;
  [key: string]: unknown;
}

// ── Task ───────────────────────────────────────────────────────

export interface Task {
  id: string;
  taskNo: string;
  task: string;
  assignedTo: string;
  delegatedBy: string;
  status: string;
  priority: string;
  dueDate: string;
  finalStatus: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface SavedTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  taskType: string;
  assignedType: string;
  estimatedTime: string;
  templateCategory: string;
  organizationId: string;
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
}

// ── Team ───────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  head: string;
  members: number;
  projects: number;
  status: string;
  organizationId: string;
  createdAt?: string;
  deletedAt?: string | null;
}

// ── Branch ─────────────────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  address?: string;
  managerName?: string;
  status: string;
  organizationId: string;
  createdAt?: string;
  deletedAt?: string | null;
}

// ── Client ─────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: string;
  industry?: string;
  location?: string;
  logoId?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// ── Master Data ────────────────────────────────────────────────

export interface MasterData {
  id: string;
  name: string;
  values: string[];
  organizationId: string;
  createdAt?: string;
  deletedAt?: string | null;
}

// ── File ───────────────────────────────────────────────────────

export interface FileRecord {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  organizationId: string;
  storageKey: string;
  createdAt?: string;
}

// ── Presence ───────────────────────────────────────────────────

export interface UserPresence {
  userId: string;
  status: "Online" | "Offline" | "Away" | "Leave";
  lastSeen?: string;
  device?: string;
  ipAddress?: string;
}

// ── Auth session ───────────────────────────────────────────────

export interface AuthSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    role?: string;
    organizationId?: string;
  };
  profile?: UserProfile | null;
  organization: Organization | null;
  membership: { role: string; organizationId: string } | null;
}

// ── API response wrappers ──────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
