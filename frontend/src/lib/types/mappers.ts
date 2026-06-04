/**
 * Data mappers — single source of truth for API → frontend type conversion.
 * Backend returns documents with _id, frontend uses id.
 * All mapping logic lives here, nowhere else.
 */

import type {
  Organization,
  UserProfile,
  EmployeeStats,
  OrgMember,
  Task,
  TaskStats,
  SavedTask,
  Team,
  Branch,
  Client,
  MasterData,
  FileRecord,
  AuthSession,
  RoleName,
} from "@/types";
import { ROLE_HIERARCHY } from "@/types";

// ── ID normalization ──────────────────────────────────────────

function normalizeId(doc: { _id?: string | { toString(): string } }): string {
  if (!doc._id) return "";
  return typeof doc._id === "string" ? doc._id : doc._id.toString();
}

// ── Organization ───────────────────────────────────────────────

export function mapOrganization(doc: Record<string, unknown> | null): Organization | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    name: (doc.name as string) ?? "",
    category: (doc.category as string) ?? "",
    companyRange: (doc.companyRange as string) ?? "",
    email: (doc.email as string) ?? "",
    ownerEmail: (doc.ownerEmail as string) ?? "",
    ownerId: (doc.ownerId as string) ?? "",
    logoUrl: (doc.logoUrl as string) ?? "",
    industry: (doc.industry as string) ?? "",
    size: (doc.size as string) ?? "",
    status: (doc.status as Organization["status"]) ?? "active",
    hrSettings: (doc.hrSettings as Record<string, unknown>) ?? {},
    themeSettings: (doc.themeSettings as Record<string, unknown>) ?? {},
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

// ── User Profile ───────────────────────────────────────────────

export function mapUserProfile(doc: Record<string, unknown> | null): UserProfile | null {
  if (!doc) return null;
  const firstName = (doc.firstName as string) ?? "";
  const lastName = (doc.lastName as string) ?? "";
  return {
    id: normalizeId(doc as { _id: string }),
    userId: (doc.userId as string) ?? normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? null,
    roleId: (doc.roleId as string) ?? "",
    role: (doc.role as RoleName) ?? "MEMBER",
    email: (doc.email as string) ?? "",
    firstName,
    lastName,
    name: (doc.name as string) ?? `${firstName} ${lastName}`.trim(),
    phone: (doc.phone as string) ?? "",
    designation: (doc.designation as string) ?? "",
    department: (doc.department as string) ?? "",
    avatarUrl: (doc.avatarUrl as string) ?? "",
    bio: (doc.bio as string) ?? "",
    expertise: Array.isArray(doc.expertise) ? (doc.expertise as string[]) : [],
    empId: (doc.empId as string) ?? "",
    employmentType: (doc.employmentType as UserProfile["employmentType"]) ?? "full_time",
    status: (doc.status as UserProfile["status"]) ?? "active",
    teamIds: Array.isArray(doc.teamIds) ? (doc.teamIds as string[]) : [],
    joiningDate: (doc.joiningDate as string) ?? "",
    terminationDate: (doc.terminationDate as string) ?? null,
    terminationReason: (doc.terminationReason as string) ?? null,
    lastLogin: (doc.lastLogin as string) ?? null,
    loginCount: (doc.loginCount as number) ?? 0,
    emailVerified: (doc.emailVerified as boolean) ?? false,
    profileCompletion: (doc.profileCompletion as number) ?? 0,
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

// ── Org Member ─────────────────────────────────────────────────

export function mapOrgMember(doc: Record<string, unknown> | null): OrgMember | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? null,
    userId: (doc.userId as string) ?? "",
    role: (doc.role as RoleName) ?? "MEMBER",
    status: (doc.status as string) ?? "active",
    invitedBy: (doc.invitedBy as string) ?? "",
    joinedAt: (doc.joinedAt as string) ?? "",
    createdAt: (doc.createdAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

// ── Task ───────────────────────────────────────────────────────

export function mapTask(doc: Record<string, unknown> | null): Task | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    taskNo: (doc.taskNo as string) ?? "",
    title: (doc.title as string) ?? (doc.task as string) ?? "",
    description: (doc.description as string) ?? "",
    assignedType: (doc.assignedType as Task["assignedType"]) ?? "member",
    assignedTo: (doc.assignedTo as string) ?? "",
    assignedBy: (doc.assignedBy as string) ?? "",
    status: (doc.status as Task["status"]) ?? "pending",
    priority: (doc.priority as Task["priority"]) ?? "medium",
    startDate: (doc.startDate as string) ?? "",
    dueDate: (doc.dueDate as string) ?? "",
    completedAt: (doc.completedAt as string) ?? "",
    reviewedBy: (doc.reviewedBy as string) ?? "",
    reviewNotes: (doc.reviewNotes as string) ?? "",
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    createdBy: (doc.createdBy as string) ?? "",
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapTasks(docs: Record<string, unknown>[]): Task[] {
  return docs.map(mapTask).filter((t): t is Task => t !== null);
}

// ── Saved Task ─────────────────────────────────────────────────

export function mapSavedTask(doc: Record<string, unknown> | null): SavedTask | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    title: (doc.title as string) ?? "",
    description: (doc.description as string) ?? "",
    priority: (doc.priority as string) ?? "medium",
    taskType: (doc.taskType as string) ?? "",
    assignedType: (doc.assignedType as string) ?? "",
    estimatedTime: (doc.estimatedTime as string) ?? "",
    templateCategory: (doc.templateCategory as string) ?? "",
    createdAt: (doc.createdAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapSavedTasks(docs: Record<string, unknown>[]): SavedTask[] {
  return docs.map(mapSavedTask).filter((t): t is SavedTask => t !== null);
}

// ── Team ───────────────────────────────────────────────────────

export function mapTeam(doc: Record<string, unknown> | null): Team | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    name: (doc.name as string) ?? "",
    description: (doc.description as string) ?? "",
    headUserId: (doc.headUserId as string) ?? (doc.head as string) ?? "",
    memberIds: Array.isArray(doc.memberIds)
      ? (doc.memberIds as string[])
      : Array.isArray(doc.members)
        ? (doc.members as string[])
        : [],
    status: (doc.status as Team["status"]) ?? "active",
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapTeams(docs: Record<string, unknown>[]): Team[] {
  return docs.map(mapTeam).filter((t): t is Team => t !== null);
}

// ── Branch ─────────────────────────────────────────────────────

export function mapBranch(doc: Record<string, unknown> | null): Branch | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    name: (doc.name as string) ?? "",
    address: (doc.address as string) ?? "",
    managerName: (doc.managerName as string) ?? "",
    status: (doc.status as string) ?? "active",
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapBranches(docs: Record<string, unknown>[]): Branch[] {
  return docs.map(mapBranch).filter((b): b is Branch => b !== null);
}

// ── Client ─────────────────────────────────────────────────────

export function mapClient(doc: Record<string, unknown> | null): Client | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    name: (doc.name as string) ?? "",
    contactPerson: (doc.contactPerson as string) ?? "",
    email: (doc.email as string) ?? "",
    phone: (doc.phone as string) ?? "",
    status: (doc.status as string) ?? "active",
    industry: (doc.industry as string) ?? "",
    location: (doc.location as string) ?? "",
    createdAt: (doc.createdAt as string) ?? "",
    updatedAt: (doc.updatedAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapClients(docs: Record<string, unknown>[]): Client[] {
  return docs.map(mapClient).filter((c): c is Client => c !== null);
}

// ── Master Data ────────────────────────────────────────────────

export function mapMasterData(doc: Record<string, unknown> | null): MasterData | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    name: (doc.name as string) ?? "",
    values: Array.isArray(doc.values) ? (doc.values as string[]) : [],
    createdAt: (doc.createdAt as string) ?? "",
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export function mapMasterDataList(docs: Record<string, unknown>[]): MasterData[] {
  return docs.map(mapMasterData).filter((m): m is MasterData => m !== null);
}

// ── File Record ────────────────────────────────────────────────

export function mapFileRecord(doc: Record<string, unknown> | null): FileRecord | null {
  if (!doc) return null;
  return {
    id: normalizeId(doc as { _id: string }),
    organizationId: (doc.organizationId as string) ?? "",
    workspaceId: (doc.workspaceId as string) ?? "",
    userId: (doc.userId as string) ?? "",
    userName: (doc.userName as string) ?? "",
    filename: (doc.filename as string) ?? "",
    originalName: (doc.originalName as string) ?? "",
    mimetype: (doc.mimetype as string) ?? "",
    size: (doc.size as number) ?? 0,
    url: (doc.url as string) ?? "",
    key: (doc.key as string) ?? "",
    folder: (doc.folder as string) ?? "",
    createdAt: (doc.createdAt as string) ?? "",
  };
}

export function mapFileRecords(docs: Record<string, unknown>[]): FileRecord[] {
  return docs.map(mapFileRecord).filter((f): f is FileRecord => f !== null);
}

// ── Auth Session ───────────────────────────────────────────────

export function mapAuthSession(
  user: Record<string, unknown>,
  organization: Record<string, unknown> | null,
  membership: Record<string, unknown> | null,
): AuthSession {
  const firstName = (user.firstName as string) ?? "";
  const lastName = (user.lastName as string) ?? "";
  const role = (membership?.role as RoleName) ?? (user.role as RoleName) ?? "MEMBER";

  return {
    user: {
      id: (user.$id as string) ?? normalizeId(user as { _id: string }),
      email: (user.email as string) ?? "",
      firstName,
      lastName,
      name:
        (user.name as string) ??
        `${firstName} ${lastName}`.trim(),
      avatarUrl: (user.avatarUrl as string) ?? "",
      emailVerified: (user.emailVerified as boolean) ?? false,
      role,
      organizationId: (membership?.organizationId as string) ?? (user.organizationId as string) ?? "",
      workspaceId: (membership?.workspaceId as string) ?? null,
    },
    profile: null,
    organization: mapOrganization(organization),
    membership: membership
      ? {
          role: membership.role as RoleName,
          organizationId: membership.organizationId as string,
          workspaceId: (membership.workspaceId as string) ?? null,
        }
      : null,
  };
}

// ── Task Stats ──────────────────────────────────────────────────

export function mapTaskStats(data: Record<string, unknown> | null): TaskStats {
  if (!data) {
    return { todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0, postponedTask: 0, repeatedTask: 0, overdueTask: 0, totalTask: 0 };
  }
  return {
    todayTask: (data.todayTask as number) ?? 0,
    inProgressTask: (data.inProgressTask as number) ?? 0,
    teamTask: (data.teamTask as number) ?? 0,
    pendingTask: (data.pendingTask as number) ?? 0,
    postponedTask: (data.postponedTask as number) ?? 0,
    repeatedTask: (data.repeatedTask as number) ?? 0,
    overdueTask: (data.overdueTask as number) ?? 0,
    totalTask: (data.totalTask as number) ?? 0,
  };
}

// ── Role helpers ───────────────────────────────────────────────

export function canManageRole(actorRole: RoleName, targetRole: RoleName): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function hasRoleAccess(userRole: RoleName, requiredRole: RoleName): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleLevel(role: RoleName): number {
  return ROLE_HIERARCHY[role] ?? 0;
}
