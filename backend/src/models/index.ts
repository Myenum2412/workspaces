/**
 * Production MongoDB models — all collections.
 *
 * Core 13 workspace collections:
 *   organizations, orgmembers, orginvitations, userprofiles, billingusers,
 *   branches, clients, masterdatas, savedtasks, screentimes, tasks, teams, workspaces
 *
 * Supporting collections (auth, audit, branding, files, presence, profiles):
 *   users (legacy admin), logins, userstatus, userstatushistories,
 *   auditlogs, brandingconfigs, brandinghistories, filerecords,
 *   profilehistories, profileactivities
 */
import mongoose, { Schema, Document, Model } from "mongoose";

// ═══════════════════════════════════════════════════════════════
// CORE 13 WORKSPACE COLLECTIONS
// ═══════════════════════════════════════════════════════════════

// ── 1. ORGANIZATIONS ──────────────────────────────────────────
export interface IOrganization {
  _id: string; name: string; category: string; companyRange: string;
  email: string; ownerEmail: string; ownerId: string; logoUrl: string;
  industry: string; size: string; status: "active" | "suspended" | "archived";
  settings: Record<string, any>; hrSettings: Record<string, any>;
  themeSettings: Record<string, any>; createdAt: string; updatedAt: string;
  deletedAt: string | null;
}
export interface IOrganizationDocument extends IOrganization, Document<string> {}
const OrganizationSchema = new Schema<IOrganizationDocument>({
  _id: { type: String }, name: { type: String, required: true },
  category: { type: String, default: "" }, companyRange: { type: String, default: "" },
  email: { type: String, default: "" }, ownerEmail: { type: String, default: "" },
  ownerId: { type: String, default: "" }, logoUrl: { type: String, default: "" },
  industry: { type: String, default: "" }, size: { type: String, default: "" },
  status: { type: String, enum: ["active", "suspended", "archived"], default: "active" },
  settings: { type: Schema.Types.Mixed, default: {} },
  hrSettings: { type: Schema.Types.Mixed, default: {} },
  themeSettings: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
OrganizationSchema.index({ status: 1 });
export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization || mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);

// ── 2. ORG MEMBERS ────────────────────────────────────────────
export interface IOrgMember {
  _id: string; organizationId: string; workspaceId: string | null;
  userId: string; role: "ORG_ADMIN" | "WORKSPACE_MANAGER" | "MEMBER";
  status: string; invitedBy: string; joinedAt: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IOrgMemberDocument extends IOrgMember, Document<string> {}
const OrgMemberSchema = new Schema<IOrgMemberDocument>({
  _id: { type: String },
  organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null, index: true },
  userId: { type: String, required: true },
  role: { type: String, required: true, enum: ["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"] },
  status: { type: String, required: true, default: "active" },
  invitedBy: { type: String, default: "" }, joinedAt: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
OrgMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
export const OrgMember: Model<IOrgMemberDocument> =
  mongoose.models.OrgMember || mongoose.model<IOrgMemberDocument>("OrgMember", OrgMemberSchema);

// ── 3. ORG INVITATIONS ────────────────────────────────────────
export interface IOrgInvitation {
  _id: string; organizationId: string; email: string;
  role: "ORG_ADMIN" | "WORKSPACE_MANAGER" | "MEMBER";
  invitedBy: string; token: string; status: string; expiresAt: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IOrgInvitationDocument extends IOrgInvitation, Document<string> {}
const OrgInvitationSchema = new Schema<IOrgInvitationDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"] },
  invitedBy: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, required: true, default: "pending" },
  expiresAt: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const OrgInvitation: Model<IOrgInvitationDocument> =
  mongoose.models.OrgInvitation || mongoose.model<IOrgInvitationDocument>("OrgInvitation", OrgInvitationSchema);

// ── 4. USER PROFILES ──────────────────────────────────────────
export interface IUserProfile {
  _id: string; organizationId: string; workspaceId: string | null;
  userId: string; firstName: string; lastName: string; email: string;
  passwordHash?: string; phone: string; designation: string; department: string;
  avatarUrl: string; bio: string; expertise: string[]; empId: string;
  joiningDate: string; employmentType: string;
  status: "active" | "inactive" | "suspended" | "terminated" | "archived";
  terminationDate: string | null; terminationReason: string | null;
  lastLogin: Date | null; loginCount: number; emailVerified: boolean;
  teamIds: string[]; createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IUserProfileDocument extends IUserProfile, Document<string> {}
const UserProfileSchema = new Schema<IUserProfileDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, default: null, index: true },
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true }, lastName: { type: String, default: "" },
  email: { type: String, required: true, lowercase: true },
  passwordHash: { type: String, select: false }, phone: { type: String, default: "" },
  designation: { type: String, default: "" }, department: { type: String, default: "" },
  avatarUrl: { type: String, default: "" }, bio: { type: String, default: "" },
  expertise: [{ type: String }], empId: { type: String, required: true, unique: true },
  joiningDate: { type: String, default: "" }, employmentType: { type: String, default: "full_time" },
  status: { type: String, enum: ["active", "inactive", "suspended", "terminated", "archived"], default: "active" },
  terminationDate: { type: String, default: null }, terminationReason: { type: String, default: null },
  lastLogin: { type: Date, default: null }, loginCount: { type: Number, default: 0 },
  emailVerified: { type: Boolean, default: false }, teamIds: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
UserProfileSchema.index({ organizationId: 1, workspaceId: 1, status: 1 });
UserProfileSchema.index({ organizationId: 1, email: 1 }, { unique: true });
UserProfileSchema.index({ empId: 1 }, { unique: true });
export const UserProfile: Model<IUserProfileDocument> =
  mongoose.models.UserProfile || mongoose.model<IUserProfileDocument>("UserProfile", UserProfileSchema);

// ── 5. BILLING USERS ──────────────────────────────────────────
export interface IBillingUser {
  _id: string; organizationId: string; userId: string; plan: string;
  status: string; billingEmail: string; billingName: string;
  billingAddress: string; paymentMethod: string; subscriptionId: string;
  currentPeriodStart: string; currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean; createdAt: string; updatedAt: string;
  deletedAt: string | null;
}
export interface IBillingUserDocument extends IBillingUser, Document<string> {}
const BillingUserSchema = new Schema<IBillingUserDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  userId: { type: String, required: true }, plan: { type: String, default: "free" },
  status: { type: String, default: "trial" }, billingEmail: { type: String, default: "" },
  billingName: { type: String, default: "" }, billingAddress: { type: String, default: "" },
  paymentMethod: { type: String, default: "" }, subscriptionId: { type: String, default: "" },
  currentPeriodStart: { type: String, default: "" }, currentPeriodEnd: { type: String, default: "" },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const BillingUser: Model<IBillingUserDocument> =
  mongoose.models.BillingUser || mongoose.model<IBillingUserDocument>("BillingUser", BillingUserSchema);

// ── 6. BRANCHES ───────────────────────────────────────────────
export interface IBranch {
  _id: string; organizationId: string; workspaceId: string;
  name: string; address: string; managerName: string; status: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IBranchDocument extends IBranch, Document<string> {}
const BranchSchema = new Schema<IBranchDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true }, address: { type: String, default: "" },
  managerName: { type: String, default: "" },
  status: { type: String, required: true, default: "active" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const Branch: Model<IBranchDocument> =
  mongoose.models.Branch || mongoose.model<IBranchDocument>("Branch", BranchSchema);

// ── 7. CLIENTS ────────────────────────────────────────────────
export interface IClient {
  _id: string; organizationId: string; workspaceId: string;
  name: string; contactPerson: string; email: string; phone: string;
  status: string; industry: string; location: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IClientDocument extends IClient, Document<string> {}
const ClientSchema = new Schema<IClientDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true }, contactPerson: { type: String, default: "" },
  email: { type: String, default: "" }, phone: { type: String, default: "" },
  status: { type: String, required: true, default: "active" },
  industry: { type: String, default: "" }, location: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const Client: Model<IClientDocument> =
  mongoose.models.Client || mongoose.model<IClientDocument>("Client", ClientSchema);

// ── 8. MASTER DATAS ───────────────────────────────────────────
export interface IMasterData {
  _id: string; organizationId: string; workspaceId: string;
  name: string; values: string[]; createdAt: string; updatedAt: string;
  deletedAt: string | null;
}
export interface IMasterDataDocument extends IMasterData, Document<string> {}
const MasterDataSchema = new Schema<IMasterDataDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true }, values: [{ type: String }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const MasterData: Model<IMasterDataDocument> =
  mongoose.models.MasterData || mongoose.model<IMasterDataDocument>("MasterData", MasterDataSchema);

// ── 9. SAVED TASKS ────────────────────────────────────────────
export interface ISavedTask {
  _id: string; organizationId: string; workspaceId: string;
  title: string; description: string; priority: string; taskType: string;
  assignedType: string; estimatedTime: string; templateCategory: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface ISavedTaskDocument extends ISavedTask, Document<string> {}
const SavedTaskSchema = new Schema<ISavedTaskDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  title: { type: String, required: true }, description: { type: String, default: "" },
  priority: { type: String, default: "medium" }, taskType: { type: String, default: "" },
  assignedType: { type: String, default: "" }, estimatedTime: { type: String, default: "" },
  templateCategory: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const SavedTask: Model<ISavedTaskDocument> =
  mongoose.models.SavedTask || mongoose.model<ISavedTaskDocument>("SavedTask", SavedTaskSchema);

// ── 10. SCREEN TIMES ──────────────────────────────────────────
export interface IScreenTime {
  _id: string; organizationId: string; workspaceId: string; userId: string;
  date: string; totalMinutes: number; sessions: any[];
  status: "online" | "idle" | "offline"; lastActiveAt: string;
  createdAt: string; updatedAt: string;
}
export interface IScreenTimeDocument extends IScreenTime, Document<string> {}
const ScreenTimeSchema = new Schema<IScreenTimeDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, totalMinutes: { type: Number, default: 0 },
  sessions: [{ type: Schema.Types.Mixed, default: [] }],
  status: { type: String, enum: ["online", "idle", "offline"], default: "offline" },
  lastActiveAt: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
ScreenTimeSchema.index({ organizationId: 1, workspaceId: 1, userId: 1, date: 1 }, { unique: true });
export const ScreenTime: Model<IScreenTimeDocument> =
  mongoose.models.ScreenTime || mongoose.model<IScreenTimeDocument>("ScreenTime", ScreenTimeSchema);

// ── 11. TASKS ─────────────────────────────────────────────────
export type TaskStatus = "pending" | "assigned" | "in_progress" | "under_review" | "completed" | "rejected" | "on_hold";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskAssignType = "member" | "team";
export interface ITask {
  _id: string; organizationId: string; workspaceId: string;
  taskNo: string; title: string; description: string;
  assignedTo: string; assignedType: TaskAssignType; assignedBy: string;
  status: TaskStatus; priority: TaskPriority;
  startDate: string; dueDate: string; completedAt: string;
  reviewedBy: string; reviewNotes: string; tags: string[];
  reallocationHistory: any[]; createdAt: string; updatedAt: string;
  deletedAt: string | null;
}
export interface ITaskDocument extends ITask, Document<string> {}
const TaskSchema = new Schema<ITaskDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  taskNo: { type: String, required: true }, title: { type: String, required: true },
  description: { type: String, default: "" },
  assignedTo: { type: String, required: true },
  assignedType: { type: String, required: true, enum: ["member", "team"] },
  assignedBy: { type: String, required: true },
  status: { type: String, required: true, enum: ["pending", "assigned", "in_progress", "under_review", "completed", "rejected", "on_hold"], default: "pending" },
  priority: { type: String, default: "medium", enum: ["low", "medium", "high", "urgent"] },
  startDate: { type: String, default: "" }, dueDate: { type: String, default: "" },
  completedAt: { type: String, default: "" }, reviewedBy: { type: String, default: "" },
  reviewNotes: { type: String, default: "" }, tags: [{ type: String }],
  reallocationHistory: [{ type: Schema.Types.Mixed, default: [] }],
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, assignedTo: 1 });
TaskSchema.index({ workspaceId: 1, taskNo: 1 }, { unique: true });
export const Task: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);

// ── 12. TEAMS ─────────────────────────────────────────────────
export interface ITeam {
  _id: string; organizationId: string; workspaceId: string;
  name: string; description: string; headUserId: string; memberIds: string[];
  status: string; createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface ITeamDocument extends ITeam, Document<string> {}
const TeamSchema = new Schema<ITeamDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  name: { type: String, required: true }, description: { type: String, default: "" },
  headUserId: { type: String, default: "" }, memberIds: [{ type: String }],
  status: { type: String, required: true, default: "active" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const Team: Model<ITeamDocument> =
  mongoose.models.Team || mongoose.model<ITeamDocument>("Team", TeamSchema);

// ── 13. WORKSPACES ────────────────────────────────────────────
export interface IWorkspace {
  _id: string; organizationId: string; name: string; description: string;
  status: string; settings: Record<string, any>; createdBy: string;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface IWorkspaceDocument extends IWorkspace, Document<string> {}
const WorkspaceSchema = new Schema<IWorkspaceDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  name: { type: String, required: true }, description: { type: String, default: "" },
  status: { type: String, required: true, default: "active" },
  settings: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  deletedAt: { type: String, default: null, index: true },
}, { timestamps: false });
export const Workspace: Model<IWorkspaceDocument> =
  mongoose.models.Workspace || mongoose.model<IWorkspaceDocument>("Workspace", WorkspaceSchema);


// ═══════════════════════════════════════════════════════════════
// SUPPORTING COLLECTIONS
// ═══════════════════════════════════════════════════════════════

// ── USERS (legacy admin accounts) ─────────────────────────────
export interface IUser {
  _id: string; name: string; email: string; passwordHash: string;
  role: string; status: string; lastLogin: Date | null;
  createdAt: string; updatedAt: string;
}
export interface IUserDocument extends IUser, Document<string> {}
const UserSchema = new Schema<IUserDocument>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: "ORG_ADMIN" },
  status: { type: String, required: true, default: "active" },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });
UserSchema.index({ email: 1 }, { unique: true });
export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

// ── LOGIN ACTIVITY ────────────────────────────────────────────
export interface ILoginActivity {
  _id: string; userId: string; email: string; ipAddress: string;
  userAgent: string; status: "success" | "failed"; failureReason: string | null;
  createdAt: string;
}
export interface ILoginActivityDocument extends ILoginActivity, Document<string> {}
const LoginActivitySchema = new Schema<ILoginActivityDocument>({
  _id: { type: String }, userId: { type: String, required: true },
  email: { type: String, required: true }, ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  status: { type: String, required: true, enum: ["success", "failed"] },
  failureReason: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
LoginActivitySchema.index({ userId: 1, createdAt: -1 });
export const LoginActivity: Model<ILoginActivityDocument> =
  mongoose.models.LoginActivity || mongoose.model<ILoginActivityDocument>("LoginActivity", LoginActivitySchema);

// ── USER STATUS (socket presence) ─────────────────────────────
export interface IUserStatus {
  _id: string; userId: string; status: string; lastActiveAt: Date;
}
export interface IUserStatusDocument extends IUserStatus, Document<string> {}
const UserStatusSchema = new Schema<IUserStatusDocument>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  userId: { type: String, required: true, unique: true },
  status: { type: String, required: true, default: "Offline" },
  lastActiveAt: { type: Date, default: Date.now },
}, { timestamps: true });
UserStatusSchema.index({ userId: 1 });
UserStatusSchema.index({ status: 1 });
export const UserStatus: Model<IUserStatusDocument> =
  mongoose.models.UserStatus || mongoose.model<IUserStatusDocument>("UserStatus", UserStatusSchema);

// ── USER STATUS HISTORY ───────────────────────────────────────
export interface IUserStatusHistory {
  _id: string; userId: string; status: string; loginTimestamp: Date;
  logoutTimestamp: Date | null; lastActiveTime: Date | null; durations: any[];
}
export interface IUserStatusHistoryDocument extends IUserStatusHistory, Document<string> {}
const UserStatusHistorySchema = new Schema<IUserStatusHistoryDocument>({
  _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  userId: { type: String, required: true }, status: { type: String, required: true },
  loginTimestamp: { type: Date, required: true, default: Date.now },
  logoutTimestamp: { type: Date, default: null }, lastActiveTime: { type: Date, default: null },
  durations: [{ type: Schema.Types.Mixed, default: [] }],
}, { timestamps: true });
UserStatusHistorySchema.index({ userId: 1, loginTimestamp: -1 });
export const UserStatusHistory: Model<IUserStatusHistoryDocument> =
  mongoose.models.UserStatusHistory || mongoose.model<IUserStatusHistoryDocument>("UserStatusHistory", UserStatusHistorySchema);

// ── AUDIT LOG ─────────────────────────────────────────────────
export interface IAuditLog {
  _id: string; organizationId: string; action: string;
  severity: "info" | "warn" | "error"; userId: string | null;
  userEmail: string | null; ipAddress: string | null; userAgent: string | null;
  method: string | null; path: string | null; statusCode: number | null;
  metadata: Record<string, any> | null; errorMessage: string | null;
  createdAt: string;
}
export interface IAuditLogDocument extends IAuditLog, Document<string> {}
const AuditLogSchema = new Schema<IAuditLogDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  severity: { type: String, enum: ["info", "warn", "error"], default: "info" },
  userId: { type: String, default: null }, userEmail: { type: String, default: null },
  ipAddress: { type: String, default: null }, userAgent: { type: String, default: null },
  method: { type: String, default: null }, path: { type: String, default: null },
  statusCode: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

// ── BRANDING CONFIG ───────────────────────────────────────────
export interface IBrandingConfig {
  _id: string; organizationId: string; colors: Record<string, any>;
  darkModeColors: Record<string, any>; typography: Record<string, any>;
  logo: Record<string, any>; favicon: string; mode: string;
  presetName: string; version: number; updatedBy: string;
  createdAt: string; updatedAt: string;
}
export interface IBrandingConfigDocument extends IBrandingConfig, Document<string> {}
const BrandingConfigSchema = new Schema<IBrandingConfigDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, unique: true, index: true },
  colors: { type: Schema.Types.Mixed, default: {} },
  darkModeColors: { type: Schema.Types.Mixed, default: {} },
  typography: { type: Schema.Types.Mixed, default: {} },
  logo: { type: Schema.Types.Mixed, default: {} },
  favicon: { type: String, default: "" }, mode: { type: String, default: "light" },
  presetName: { type: String, default: "emerald" }, version: { type: Number, default: 1 },
  updatedBy: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
export const BrandingConfig: Model<IBrandingConfigDocument> =
  mongoose.models.BrandingConfig || mongoose.model<IBrandingConfigDocument>("BrandingConfig", BrandingConfigSchema);
export const defaultBrandingColors: Record<string, string> = {
  primary: "#059669", primaryHover: "#047857", primaryForeground: "#ffffff",
  secondary: "#f3f4f6", secondaryForeground: "#1f2937",
  accent: "#10b981", accentForeground: "#ffffff",
  background: "#ffffff", foreground: "#000000",
  card: "#ffffff", cardForeground: "#000000",
  border: "#e5e7eb", muted: "#f3f4f6", mutedForeground: "#6b7280",
  ring: "#059669", sidebar: "#ffffff", sidebarForeground: "#1f2937",
  sidebarPrimary: "#059669", sidebarPrimaryForeground: "#ffffff",
  sidebarAccent: "#f3f4f6", sidebarAccentForeground: "#1f2937",
};

// ── BRANDING HISTORY ──────────────────────────────────────────
export interface IBrandingHistory {
  _id: string; organizationId: string; version: number; changes: any[];
  snapshot: any; updatedBy: string; updatedByName: string;
  rollbackFrom: number | null; createdAt: string;
}
export interface IBrandingHistoryDocument extends IBrandingHistory, Document<string> {}
const BrandingHistorySchema = new Schema<IBrandingHistoryDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  version: { type: Number, required: true }, changes: [{ type: Schema.Types.Mixed }],
  snapshot: { type: Schema.Types.Mixed }, updatedBy: { type: String, required: true },
  updatedByName: { type: String, default: "" }, rollbackFrom: { type: Number, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
export const BrandingHistory: Model<IBrandingHistoryDocument> =
  mongoose.models.BrandingHistory || mongoose.model<IBrandingHistoryDocument>("BrandingHistory", BrandingHistorySchema);

// ── FILE RECORD ───────────────────────────────────────────────
export interface IFileRecord {
  _id: string; organizationId: string; workspaceId: string;
  userId: string; userName: string; filename: string; originalName: string;
  mimetype: string; size: number; url: string; key: string; folder: string;
  createdAt: string;
}
export interface IFileRecordDocument extends IFileRecord, Document<string> {}
const FileRecordSchema = new Schema<IFileRecordDocument>({
  _id: { type: String }, organizationId: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  userId: { type: String, required: true }, userName: { type: String, required: true },
  filename: { type: String, required: true }, originalName: { type: String, required: true },
  mimetype: { type: String, required: true }, size: { type: Number, required: true },
  url: { type: String, required: true }, key: { type: String, required: true },
  folder: { type: String, required: true, index: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
FileRecordSchema.index({ organizationId: 1, folder: 1 });
export const FileRecord: Model<IFileRecordDocument> =
  mongoose.models.FileRecord || mongoose.model<IFileRecordDocument>("FileRecord", FileRecordSchema);

// ── PROFILE HISTORY ───────────────────────────────────────────
export interface IProfileChange { field: string; oldValue: any; newValue: any; }
export interface IProfileHistory {
  _id: string; userId: string; changes: IProfileChange[];
  modifiedBy: string | null; modifiedByEmail: string | null;
  profileVersion: number; reason: string | null; createdAt: string;
}
export interface IProfileHistoryDocument extends IProfileHistory, Document<string> {}
const ProfileHistorySchema = new Schema<IProfileHistoryDocument>({
  _id: { type: String }, userId: { type: String, required: true, index: true },
  changes: [{ field: String, oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed }],
  modifiedBy: { type: String, default: null }, modifiedByEmail: { type: String, default: null },
  profileVersion: { type: Number, required: true }, reason: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
ProfileHistorySchema.index({ userId: 1, createdAt: -1 });
export const ProfileHistory: Model<IProfileHistoryDocument> =
  mongoose.models.ProfileHistory || mongoose.model<IProfileHistoryDocument>("ProfileHistory", ProfileHistorySchema);

// ── PROFILE ACTIVITY ──────────────────────────────────────────
export interface IProfileActivity {
  _id: string; userId: string; action: string; metadata: Record<string, any>;
  deviceInfo: Record<string, any> | null; ipAddress: string | null;
  timestamp: Date; createdAt: string;
}
export interface IProfileActivityDocument extends IProfileActivity, Document<string> {}
const ProfileActivitySchema = new Schema<IProfileActivityDocument>({
  _id: { type: String }, userId: { type: String, required: true, index: true },
  action: { type: String, required: true }, metadata: { type: Schema.Types.Mixed, default: {} },
  deviceInfo: { type: Schema.Types.Mixed, default: null },
  ipAddress: { type: String, default: null }, timestamp: { type: Date, default: Date.now },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: false });
ProfileActivitySchema.index({ userId: 1, timestamp: -1 });
export const ProfileActivity: Model<IProfileActivityDocument> =
  mongoose.models.ProfileActivity || mongoose.model<IProfileActivityDocument>("ProfileActivity", ProfileActivitySchema);
