import mongoose, { Schema, Document, Model, Types } from "mongoose";

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export const UserRole = { SUPER_ADMIN: "SUPER_ADMIN", ORG_ADMIN: "ORG_ADMIN", WORKSPACE_MANAGER: "WORKSPACE_MANAGER", MEMBER: "MEMBER" } as const;
export const UserStatus = { active: "active", inactive: "inactive", suspended: "suspended", terminated: "terminated" } as const;
export const MemberRole = { ORG_ADMIN: "ORG_ADMIN", WORKSPACE_MANAGER: "WORKSPACE_MANAGER", MEMBER: "MEMBER" } as const;
export const TaskStatus = { pending: "pending", assigned: "assigned", in_progress: "in_progress", under_review: "under_review", completed: "completed", rejected: "rejected", on_hold: "on_hold" } as const;
export const TaskPriority = { low: "low", medium: "medium", high: "high", urgent: "urgent" } as const;
export const ProjectStatus = { planning: "planning", active: "active", on_hold: "on_hold", completed: "completed", archived: "archived" } as const;
export const InvitationStatus = { pending: "pending", accepted: "accepted", expired: "expired", revoked: "revoked" } as const;
export const OrgStatus = { active: "active", suspended: "suspended", archived: "archived" } as const;

// ═══════════════════════════════════════════════════════════════
// ORGANIZATION
// ═══════════════════════════════════════════════════════════════

export interface IOrganization {
  _id: string; name: string; slug: string; category: string; companyRange: string;
  email: string; ownerEmail: string; ownerId: string; logoUrl: string;
  industry: string; size: string; status: string; settings: Record<string, unknown>;
  hrSettings: Record<string, unknown>; themeSettings: Record<string, unknown>;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IOrganizationDocument extends IOrganization, Document<string> {}
const OrganizationSchema = new Schema<IOrganizationDocument>({
  _id: { type: String }, name: { type: String, required: true }, slug: { type: String, required: true, unique: true },
  category: { type: String, default: "" }, companyRange: { type: String, default: "" },
  email: { type: String, default: "" }, ownerEmail: { type: String, default: "" },
  ownerId: { type: String, default: "" }, logoUrl: { type: String, default: "" },
  industry: { type: String, default: "" }, size: { type: String, default: "" },
  status: { type: String, enum: Object.values(OrgStatus), default: "active" },
  settings: { type: Schema.Types.Mixed, default: {} },
  hrSettings: { type: Schema.Types.Mixed, default: {} },
  themeSettings: { type: Schema.Types.Mixed, default: {} },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
OrganizationSchema.index({ status: 1 });
export const Organization: Model<IOrganizationDocument> = mongoose.models.Organization || mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);

// ═══════════════════════════════════════════════════════════════
// WORKSPACE
// ═══════════════════════════════════════════════════════════════

export interface IWorkspace {
  _id: string; organizationId: string; name: string; description: string;
  status: string; settings: Record<string, unknown>; createdBy: string;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IWorkspaceDocument extends IWorkspace, Document<string> {}
const WorkspaceSchema = new Schema<IWorkspaceDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true }, description: { type: String, default: "" },
  status: { type: String, default: "active" }, settings: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: String, required: true }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
export const Workspace: Model<IWorkspaceDocument> = mongoose.models.Workspace || mongoose.model<IWorkspaceDocument>("Workspace", WorkspaceSchema);

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export interface IUser {
  _id: string; email: string; passwordHash: string; firstName: string; lastName: string;
  avatarUrl: string; phone: string; role: string; status: string; emailVerified: boolean;
  twoFactorEnabled: boolean; twoFactorSecret: string | null; loginCount: number;
  lastLoginAt: Date | null; lastLoginIp: string | null; failedLoginAttempts: number;
  lockedUntil: Date | null; createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IUserDocument extends IUser, Document<string> {}
const UserSchema = new Schema<IUserDocument>({
  _id: { type: String, default: () => new Types.ObjectId().toString() },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  firstName: { type: String, default: "" }, lastName: { type: String, default: "" },
  avatarUrl: { type: String, default: "" }, phone: { type: String, default: "" },
  role: { type: String, enum: Object.values(UserRole), default: "MEMBER" },
  status: { type: String, enum: Object.values(UserStatus), default: "active" },
  emailVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false }, twoFactorSecret: { type: String, default: null, select: false },
  loginCount: { type: Number, default: 0 }, lastLoginAt: { type: Date, default: null },
  lastLoginIp: { type: String, default: null }, failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ status: 1 });
export const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

// ═══════════════════════════════════════════════════════════════
// ORG MEMBER
// ═══════════════════════════════════════════════════════════════

export interface IOrgMember {
  _id: string; organizationId: string; workspaceId: string | null; userId: string;
  role: string; status: string; invitedBy: string; joinedAt: Date | null;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IOrgMemberDocument extends IOrgMember, Document<string> {}
const OrgMemberSchema = new Schema<IOrgMemberDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null, index: true }, userId: { type: String, required: true },
  role: { type: String, enum: Object.values(MemberRole), default: "MEMBER" },
  status: { type: String, default: "active" }, invitedBy: { type: String, default: "" },
  joinedAt: { type: Date, default: null }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
OrgMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
export const OrgMember: Model<IOrgMemberDocument> = mongoose.models.OrgMember || mongoose.model<IOrgMemberDocument>("OrgMember", OrgMemberSchema);

// ═══════════════════════════════════════════════════════════════
// ORG INVITATION
// ═══════════════════════════════════════════════════════════════

export interface IOrgInvitation {
  _id: string; organizationId: string; email: string; role: string; invitedBy: string;
  token: string; status: string; expiresAt: Date; createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IOrgInvitationDocument extends IOrgInvitation, Document<string> {}
const OrgInvitationSchema = new Schema<IOrgInvitationDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  email: { type: String, required: true }, role: { type: String, enum: Object.values(MemberRole), default: "MEMBER" },
  invitedBy: { type: String, required: true }, token: { type: String, required: true, unique: true },
  status: { type: String, enum: Object.values(InvitationStatus), default: "pending" },
  expiresAt: { type: Date, required: true }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
export const OrgInvitation: Model<IOrgInvitationDocument> = mongoose.models.OrgInvitation || mongoose.model<IOrgInvitationDocument>("OrgInvitation", OrgInvitationSchema);

// ═══════════════════════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════════════════════

export interface ITeam {
  _id: string; organizationId: string; workspaceId: string; name: string;
  description: string; headUserId: string | null; status: string;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface ITeamDocument extends ITeam, Document<string> {}
const TeamSchema = new Schema<ITeamDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true }, name: { type: String, required: true },
  description: { type: String, default: "" }, headUserId: { type: String, default: null },
  status: { type: String, default: "active" }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
export const Team: Model<ITeamDocument> = mongoose.models.Team || mongoose.model<ITeamDocument>("Team", TeamSchema);

// ═══════════════════════════════════════════════════════════════
// TEAM MEMBER
// ═══════════════════════════════════════════════════════════════

export interface ITeamMember {
  _id: string; teamId: string; userId: string; role: string; joinedAt: Date; createdAt: Date; updatedAt: Date;
}
export interface ITeamMemberDocument extends ITeamMember, Document<string> {}
const TeamMemberSchema = new Schema<ITeamMemberDocument>({
  _id: { type: String }, teamId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["LEADER", "MEMBER"], default: "MEMBER" },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });
TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
export const TeamMember: Model<ITeamMemberDocument> = mongoose.models.TeamMember || mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);

// ═══════════════════════════════════════════════════════════════
// PROJECT
// ═══════════════════════════════════════════════════════════════

export interface IProject {
  _id: string; organizationId: string; workspaceId: string; name: string;
  description: string; status: string; startDate: Date | null; endDate: Date | null;
  createdBy: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface IProjectDocument extends IProject, Document<string> {}
const ProjectSchema = new Schema<IProjectDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true }, name: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: Object.values(ProjectStatus), default: "planning" },
  startDate: { type: Date, default: null }, endDate: { type: Date, default: null },
  createdBy: { type: String, required: true }, deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
export const Project: Model<IProjectDocument> = mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);

// ═══════════════════════════════════════════════════════════════
// PROJECT MEMBER
// ═══════════════════════════════════════════════════════════════

export interface IProjectMember {
  _id: string; projectId: string; userId: string; role: string; joinedAt: Date; createdAt: Date; updatedAt: Date;
}
export interface IProjectMemberDocument extends IProjectMember, Document<string> {}
const ProjectMemberSchema = new Schema<IProjectMemberDocument>({
  _id: { type: String }, projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["OWNER", "MANAGER", "CONTRIBUTOR", "VIEWER"], default: "CONTRIBUTOR" },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
export const ProjectMember: Model<IProjectMemberDocument> = mongoose.models.ProjectMember || mongoose.model<IProjectMemberDocument>("ProjectMember", ProjectMemberSchema);

// ═══════════════════════════════════════════════════════════════
// TASK
// ═══════════════════════════════════════════════════════════════

export interface ITask {
  _id: string; organizationId: string; workspaceId: string; projectId: string | null;
  taskNo: string; title: string; description: string; assignedTo: string | null;
  assignedType: string; assignedBy: string; status: string; priority: string;
  startDate: Date | null; dueDate: Date | null; completedAt: Date | null;
  reviewedBy: string | null; reviewNotes: string | null; tags: string[];
  reallocationHistory: unknown[]; createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}
export interface ITaskDocument extends ITask, Document<string> {}
const TaskSchema = new Schema<ITaskDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  projectId: { type: String, default: null, index: true },
  taskNo: { type: String, required: true }, title: { type: String, required: true },
  description: { type: String, default: "" }, assignedTo: { type: String, default: null, index: true },
  assignedType: { type: String, enum: ["member", "team"], default: "member" },
  assignedBy: { type: String, required: true },
  status: { type: String, enum: Object.values(TaskStatus), default: "pending" },
  priority: { type: String, enum: Object.values(TaskPriority), default: "medium" },
  startDate: { type: Date, default: null }, dueDate: { type: Date, default: null },
  completedAt: { type: Date, default: null }, reviewedBy: { type: String, default: null },
  reviewNotes: { type: String, default: null }, tags: [{ type: String }],
  reallocationHistory: [{ type: Schema.Types.Mixed, default: [] }],
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
TaskSchema.index({ workspaceId: 1, taskNo: 1 }, { unique: true });
TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, assignedTo: 1 });
export const Task: Model<ITaskDocument> = mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION
// ═══════════════════════════════════════════════════════════════

export interface INotification {
  _id: string; userId: string; organizationId: string; type: string; title: string;
  message: string; data: Record<string, unknown>; read: boolean; readAt: Date | null;
  createdAt: Date; deletedAt: Date | null;
}
export interface INotificationDocument extends INotification, Document<string> {}
const NotificationSchema = new Schema<INotificationDocument>({
  _id: { type: String }, userId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  type: { type: String, required: true }, title: { type: String, required: true },
  message: { type: String, required: true }, data: { type: Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false }, readAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
export const Notification: Model<INotificationDocument> = mongoose.models.Notification || mongoose.model<INotificationDocument>("Notification", NotificationSchema);

// ═══════════════════════════════════════════════════════════════
// FILE RECORD
// ═══════════════════════════════════════════════════════════════

export interface IFileRecord {
  _id: string; organizationId: string; workspaceId: string; userId: string;
  filename: string; originalName: string; mimetype: string; size: number;
  url: string; key: string; folder: string; createdAt: Date; deletedAt: Date | null;
}
export interface IFileRecordDocument extends IFileRecord, Document<string> {}
const FileRecordSchema = new Schema<IFileRecordDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true }, userId: { type: String, required: true, index: true },
  filename: { type: String, required: true }, originalName: { type: String, required: true },
  mimetype: { type: String, required: true }, size: { type: Number, required: true },
  url: { type: String, required: true }, key: { type: String, required: true },
  folder: { type: String, default: "general", index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
FileRecordSchema.index({ organizationId: 1, folder: 1 });
export const FileRecord: Model<IFileRecordDocument> = mongoose.models.FileRecord || mongoose.model<IFileRecordDocument>("FileRecord", FileRecordSchema);

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════

export interface IActivityLog {
  _id: string; organizationId: string; workspaceId: string | null; userId: string | null;
  action: string; entityType: string; entityId: string; metadata: Record<string, unknown>;
  ipAddress: string | null; userAgent: string | null; createdAt: Date;
}
export interface IActivityLogDocument extends IActivityLog, Document<string> {}
const ActivityLogSchema = new Schema<IActivityLogDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null }, userId: { type: String, default: null, index: true },
  action: { type: String, required: true }, entityType: { type: String, required: true },
  entityId: { type: String, required: true }, metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null }, userAgent: { type: String, default: null },
}, { timestamps: true });
ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1 });
export const ActivityLog: Model<IActivityLogDocument> = mongoose.models.ActivityLog || mongoose.model<IActivityLogDocument>("ActivityLog", ActivityLogSchema);

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════

export interface IAuditLog {
  _id: string; organizationId: string; action: string; severity: string;
  userId: string | null; userEmail: string | null; ipAddress: string | null;
  userAgent: string | null; method: string | null; path: string | null;
  statusCode: number | null; metadata: Record<string, unknown>; errorMessage: string | null;
  createdAt: Date;
}
export interface IAuditLogDocument extends IAuditLog, Document<string> {}
const AuditLogSchema = new Schema<IAuditLogDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  severity: { type: String, enum: ["info", "warn", "error"], default: "info" },
  userId: { type: String, default: null }, userEmail: { type: String, default: null },
  ipAddress: { type: String, default: null }, userAgent: { type: String, default: null },
  method: { type: String, default: null }, path: { type: String, default: null },
  statusCode: { type: Number, default: null }, metadata: { type: Schema.Types.Mixed, default: {} },
  errorMessage: { type: String, default: null },
}, { timestamps: true });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
export const AuditLog: Model<IAuditLogDocument> = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

// ═══════════════════════════════════════════════════════════════
// LOGIN ACTIVITY
// ═══════════════════════════════════════════════════════════════

export interface ILoginActivity {
  _id: string; userId: string; email: string; ipAddress: string | null;
  userAgent: string | null; status: string; failureReason: string | null; createdAt: Date;
}
export interface ILoginActivityDocument extends ILoginActivity, Document<string> {}
const LoginActivitySchema = new Schema<ILoginActivityDocument>({
  _id: { type: String }, userId: { type: String, required: true },
  email: { type: String, required: true }, ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  status: { type: String, enum: ["success", "failed"], required: true },
  failureReason: { type: String, default: null },
}, { timestamps: true });
LoginActivitySchema.index({ userId: 1, createdAt: -1 });
export const LoginActivity: Model<ILoginActivityDocument> = mongoose.models.LoginActivity || mongoose.model<ILoginActivityDocument>("LoginActivity", LoginActivitySchema);

// ═══════════════════════════════════════════════════════════════
// SETTING
// ═══════════════════════════════════════════════════════════════

export interface ISetting {
  _id: string; organizationId: string; key: string; value: Record<string, unknown>;
  updatedBy: string | null; createdAt: Date; updatedAt: Date;
}
export interface ISettingDocument extends ISetting, Document<string> {}
const SettingSchema = new Schema<ISettingDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  key: { type: String, required: true }, value: { type: Schema.Types.Mixed },
  updatedBy: { type: String, default: null },
}, { timestamps: true });
SettingSchema.index({ organizationId: 1, key: 1 }, { unique: true });
export const Setting: Model<ISettingDocument> = mongoose.models.Setting || mongoose.model<ISettingDocument>("Setting", SettingSchema);

// ═══════════════════════════════════════════════════════════════
// BRANDING CONFIG
// ═══════════════════════════════════════════════════════════════

export interface IBrandingConfig {
  _id: string; organizationId: string; colors: Record<string, unknown>;
  darkModeColors: Record<string, unknown>; typography: Record<string, unknown>;
  logo: Record<string, unknown>; favicon: string; mode: string; presetName: string;
  version: number; updatedBy: string | null; createdAt: Date; updatedAt: Date;
}
export interface IBrandingConfigDocument extends IBrandingConfig, Document<string> {}
const BrandingConfigSchema = new Schema<IBrandingConfigDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, unique: true, index: true },
  colors: { type: Schema.Types.Mixed, default: {} }, darkModeColors: { type: Schema.Types.Mixed, default: {} },
  typography: { type: Schema.Types.Mixed, default: {} }, logo: { type: Schema.Types.Mixed, default: {} },
  favicon: { type: String, default: "" }, mode: { type: String, enum: ["light", "dark", "system"], default: "light" },
  presetName: { type: String, default: "emerald" }, version: { type: Number, default: 1 },
  updatedBy: { type: String, default: null },
}, { timestamps: true });
export const BrandingConfig: Model<IBrandingConfigDocument> = mongoose.models.BrandingConfig || mongoose.model<IBrandingConfigDocument>("BrandingConfig", BrandingConfigSchema);
