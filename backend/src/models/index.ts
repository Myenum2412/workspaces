// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// Model Registry — Re-exports all models from individual files
// ═══════════════════════════════════════════════════════════════

export { Organization } from "./Organization.js";
export type { IOrganization, IOrganizationDocument } from "./Organization.js";

export { Workspace } from "./Workspace.js";
export type { IWorkspace, IWorkspaceDocument } from "./Workspace.js";

export { User } from "./User.js";
export type { IUser, IUserDocument } from "./User.js";

export { OrgMember } from "./OrgMember.js";
export type { IOrgMember, IOrgMemberDocument } from "./OrgMember.js";

export { Task } from "./Task.js";
export type { ITask, ITaskDocument } from "./Task.js";

export { Project } from "./Project.js";
export type { IProject, IProjectDocument } from "./Project.js";

export { Team } from "./Team.js";
export type { ITeam, ITeamDocument } from "./Team.js";

export { TeamMember } from "./TeamMember.js";
export type { ITeamMember, ITeamMemberDocument } from "./TeamMember.js";

export { ProjectMember } from "./ProjectMember.js";
export type { IProjectMember, IProjectMemberDocument } from "./ProjectMember.js";

export { Notification } from "./Notification.js";
export type { INotification, INotificationDocument } from "./Notification.js";

export { FileRecord } from "./FileRecord.js";
export type { IFileRecord, IFileRecordDocument } from "./FileRecord.js";

export { ActivityLog } from "./ActivityLog.js";
export type { IActivityLog, IActivityLogDocument } from "./ActivityLog.js";

export { AuditLog } from "./AuditLog.js";
export type { IAuditLog, IAuditLogDocument } from "./AuditLog.js";

export { LoginActivity } from "./LoginActivity.js";
export type { ILoginActivity, ILoginActivityDocument } from "./LoginActivity.js";

export { Setting } from "./Setting.js";
export type { ISetting, ISettingDocument } from "./Setting.js";

export { PasswordReset } from "./PasswordReset.js";
export type { IPasswordReset, IPasswordResetDocument } from "./PasswordReset.js";

export { OrgInvitation } from "./UserStatus.js";
export type { IOrgInvitation, IOrgInvitationDocument } from "./UserStatus.js";

export { UserStatus, UserStatusHistory } from "./UserStatus.js";
export type { IUserStatus, IUserStatusDocument, IUserStatusHistory, IUserStatusHistoryDocument } from "./UserStatus.js";

export { BrandingConfig } from "./BrandingConfig.js";
export type { IBrandingConfig, IBrandingConfigDocument } from "./BrandingConfig.js";

// ── Enums (kept here for backward compatibility) ──────────────

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  WORKSPACE_MANAGER: "WORKSPACE_MANAGER",
  MEMBER: "MEMBER",
} as const;

export const UserStatusEnum = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
  terminated: "terminated",
} as const;

export const MemberRole = {
  ORG_ADMIN: "ORG_ADMIN",
  WORKSPACE_MANAGER: "WORKSPACE_MANAGER",
  MEMBER: "MEMBER",
} as const;

export const TaskStatus = {
  pending: "pending",
  assigned: "assigned",
  in_progress: "in_progress",
  under_review: "under_review",
  completed: "completed",
  rejected: "rejected",
  on_hold: "on_hold",
} as const;

export const TaskPriority = {
  low: "low",
  medium: "medium",
  high: "high",
  urgent: "urgent",
} as const;

export const ProjectStatus = {
  planning: "planning",
  active: "active",
  on_hold: "on_hold",
  completed: "completed",
  archived: "archived",
} as const;

export const InvitationStatus = {
  pending: "pending",
  accepted: "accepted",
  expired: "expired",
  revoked: "revoked",
} as const;

export const OrgStatus = {
  active: "active",
  suspended: "suspended",
  archived: "archived",
} as const;
