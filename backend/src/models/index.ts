// Re-export all existing models
export {
  Organization,
  IOrganization,
  UserProfile,
  IUserProfile,
  OrgMember,
  IOrgMember,
  OrgInvitation,
  IOrgInvitation,
  Client,
  IClient,
  Task,
  ITask,
  Team,
  ITeam,
  Branch,
  IBranch,
  SavedTask,
  ISavedTask,
  MasterData,
  IMasterData,
  UserStatus,
  IUserStatus,
  UserStatusHistory,
  IUserStatusHistory,
} from "./index-existing";

// Re-export profile management models
export {
  ProfileHistory,
  IProfileHistory,
  IProfileChange,
} from "./profile-history";

export {
  ProfileActivity,
  IProfileActivity,
} from "./profile-activity";

export {
  Staff,
  IStaff
} from "./staff";

// Re-export audit models
export {
  AuditLog,
  IAuditLog,
  ActivityLog,
  IActivityLog,
} from "./audit-log";

// Branding models
export {
  BrandingConfig,
  IBrandingConfig,
  IBrandingColors,
  IBrandingTypography,
  IBrandingLogo,
  defaultColors as defaultBrandingColors,
} from "./branding-config";

export {
  BrandingHistory,
  IBrandingHistory,
  IBrandingChange,
} from "./branding-history";

