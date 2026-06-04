import { z } from "zod";

// ── Organization ──────────────────────────────────────────────

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  companyRange: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  logoUrl: z.string().url().max(500).optional(),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  hrSettings: z.record(z.string(), z.any()).optional(),
  themeSettings: z.record(z.string(), z.any()).optional(),
}).strict();

// ── Org Member ────────────────────────────────────────────────

export const createMemberSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["viewer", "member", "operator", "admin", "owner"]),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  invitedBy: z.string().optional(),
}).strict();

export const updateMemberSchema = z.object({
  role: z.enum(["viewer", "member", "operator", "admin", "owner"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
}).strict();

// ── Branch ────────────────────────────────────────────────────

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  managerName: z.string().max(200).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
}).strict();

export const updateBranchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional(),
  managerName: z.string().max(200).optional(),
  status: z.enum(["active", "inactive"]).optional(),
}).strict();

// ── Client ────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  status: z.string().max(50).default("active"),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
}).strict();

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  status: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
}).strict();

// ── Team ──────────────────────────────────────────────────────

export const createTeamSchema = z.object({
  name: z.string().min(1).max(200),
  head: z.string().optional(),
  members: z.number().int().min(0).default(0),
  projects: z.number().int().min(0).default(0),
  status: z.string().max(50).default("active"),
}).strict();

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  head: z.string().optional(),
  members: z.number().int().min(0).optional(),
  projects: z.number().int().min(0).optional(),
  status: z.string().max(50).optional(),
}).strict();

// ── Task ──────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  taskNo: z.string().min(1).max(50),
  task: z.string().min(1).max(1000),
  assignedTo: z.string().optional(),
  delegatedBy: z.string().optional(),
  status: z.string().max(50).default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
  finalStatus: z.string().max(50).optional(),
}).strict();

export const updateTaskSchema = z.object({
  taskNo: z.string().min(1).max(50).optional(),
  task: z.string().min(1).max(1000).optional(),
  assignedTo: z.string().optional(),
  delegatedBy: z.string().optional(),
  status: z.string().max(50).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  finalStatus: z.string().max(50).optional(),
}).strict();

// ── Saved Task ────────────────────────────────────────────────

export const createSavedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  taskType: z.string().max(50).optional(),
  assignedType: z.string().max(50).optional(),
  estimatedTime: z.string().max(50).optional(),
  templateCategory: z.string().max(100).optional(),
}).strict();

export const updateSavedTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  taskType: z.string().max(50).optional(),
  assignedType: z.string().max(50).optional(),
  estimatedTime: z.string().max(50).optional(),
  templateCategory: z.string().max(100).optional(),
}).strict();

// ── Employee ───────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).default(""),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).default("Employee"),
  department: z.string().max(100).optional(),
  role: z.enum(["viewer", "member", "operator", "admin", "owner", "employee"]).default("employee"),
  empId: z.string().max(50).optional(),
  employmentType: z.string().max(50).default("Full Time"),
  status: z.string().max(50).default("active"),
}).strict();

export const updateEmployeeSchema = z.object({
  email: z.string().email().max(255).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  role: z.enum(["viewer", "member", "operator", "admin", "owner", "employee"]).optional(),
  status: z.string().max(50).optional(),
}).strict();

// ── Campaign ──────────────────────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sessionId: z.string().optional(),
  templateId: z.string().optional(),
  audienceType: z.enum(["all_contacts", "group", "custom_list", "tag"]).default("all_contacts"),
  audienceFilter: z.record(z.string(), z.any()).default({}),
  scheduledAt: z.string().optional(),
}).strict();

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "scheduled", "running", "paused", "completed", "cancelled"]).optional(),
}).strict();

// ── Message Template ──────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(50).default("marketing"),
  language: z.string().max(10).default("en"),
  body: z.string().min(1).max(4096),
  variables: z.array(z.string()).default([]),
  header: z.string().max(60).optional().nullable(),
  headerType: z.enum(["text", "image", "video", "document"]).optional().nullable(),
  footer: z.string().max(60).optional().nullable(),
  buttons: z.array(z.object({
    type: z.enum(["quick_reply", "url", "phone"]),
    text: z.string().max(25),
    value: z.string().max(1000),
  })).default([]),
}).strict();

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(50).optional(),
  body: z.string().min(1).max(4096).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
}).strict();

// ── Webhook ───────────────────────────────────────────────────

export const createWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.string()).default(["message.received"]),
  secret: z.string().max(200).optional().nullable(),
  headers: z.record(z.string(), z.string()).default({}),
  retryCount: z.number().int().min(0).max(10).default(3),
  sessionId: z.string().optional(),
}).strict();

export const updateWebhookSchema = z.object({
  url: z.string().url().max(500).optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().max(200).optional().nullable(),
  headers: z.record(z.string(), z.string()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  active: z.boolean().optional(),
}).strict();

// ── Contact ───────────────────────────────────────────────────

export const importContactsSchema = z.object({
  contacts: z.array(z.object({
    waContactId: z.string().min(1),
    name: z.string().max(200).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
  })).min(1).max(10000),
}).strict();

export const bulkUpdateContactsSchema = z.object({
  ids: z.array(z.string()).min(1).max(1000),
  updates: z.object({
    isBlocked: z.boolean().optional(),
  }).strict(),
}).strict();

// ── Master Data ───────────────────────────────────────────────

export const createMasterDataSchema = z.object({
  name: z.string().min(1).max(200),
  values: z.array(z.string().max(200)).min(1),
}).strict();

export const updateMasterDataSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  values: z.array(z.string().max(200)).optional(),
}).strict();

// ── Org Invitation ────────────────────────────────────────────

export const createInvitationSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(["viewer", "member", "operator", "admin"]).default("member"),
}).strict();

// ── Workspace HR Settings ─────────────────────────────────────

export const hrSettingsSchema = z.object({
  shifts: z.array(z.object({
    id: z.string(),
    name: z.string().max(200),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  attendanceGraceMinutes: z.number().int().min(0).max(60).optional(),
  overtimeMultiplier: z.number().min(1).max(3).optional(),
  timezone: z.string().max(100).optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
}).strict().passthrough();

export const themeSettingsSchema = z.object({
  sidebarColor: z.string().max(50).optional(),
  headerColor: z.string().max(50).optional(),
  accentColor: z.string().max(50).optional(),
  layout: z.enum(["default", "compact", "comfortable"]).optional(),
  sidebarCollapsed: z.boolean().optional(),
  logoPosition: z.enum(["top", "left", "center"]).optional(),
  hideLogo: z.boolean().optional(),
  fontFamily: z.string().max(200).optional(),
  fontSize: z.number().int().min(10).max(24).optional(),
  borderRadius: z.string().max(10).optional(),
  animationEnabled: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  customCSS: z.string().max(10000).optional(),
}).strict().passthrough();

export const createShiftSchema = z.object({
  name: z.string().min(1).max(200),
  startTime: z.string().min(1).max(50),
  endTime: z.string().min(1).max(50),
}).strict();

export const updateShiftSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startTime: z.string().min(1).max(50).optional(),
  endTime: z.string().min(1).max(50).optional(),
}).strict();

// ── File Record ───────────────────────────────────────────────

export const createFileRecordSchema = z.object({
  filename: z.string().min(1).max(500),
  originalName: z.string().max(500).optional(),
  mimetype: z.string().max(200).optional(),
  size: z.number().int().min(0).optional(),
  url: z.string().min(1).max(2000),
  key: z.string().min(1).max(1000),
  folder: z.string().max(500).optional(),
}).strict();
