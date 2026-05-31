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

// Re-export WhatsApp models
export {
  WhatsappInstance,
  IWhatsappInstance,
  WhatsappMessage,
  IWhatsappMessage,
  WhatsappChat,
  IWhatsappChat,
} from "./whatsapp";

// Re-export OpenWA migrated models
export {
  Session,
  ISession,
  Message,
  IMessage,
  Webhook,
  IWebhook,
  Contact,
  IContact,
  Group,
  IGroup,
  ApiKey,
  IApiKey,
  AuditLog,
  IAuditLog,
  BatchJob,
  IBatchJob,
  MessageTemplate,
  IMessageTemplate,
  Campaign,
  ICampaign,
  AutomationRule,
  IAutomationRule,
  Label,
  ILabel,
  ActivityLog,
  IActivityLog,
} from "./openwa";

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
