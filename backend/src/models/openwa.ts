// OpenWA entities migrated from TypeORM to Mongoose
// All models scoped by organizationId for multi-tenant isolation

import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";
import { softDeletePlugin } from "../middleware/soft-delete.js";

// ── Session (WhatsApp Session) ──────────────────────────────

export interface ISession extends Document<string> {
  organizationId: string;
  name: string;
  status: "created" | "initializing" | "qr_ready" | "authenticating" | "ready" | "disconnected" | "failed";
  phone: string | null;
  pushName: string | null;
  config: Record<string, unknown>;
  proxyUrl: string | null;
  proxyType: "http" | "https" | "socks4" | "socks5" | null;
  connectedAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const SessionSchema = new Schema<ISession>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ["created", "initializing", "qr_ready", "authenticating", "ready", "disconnected", "failed"],
    default: "created",
    index: true,
  },
  phone: { type: String, default: null },
  pushName: { type: String, default: null },
  config: { type: Schema.Types.Mixed, default: {} },
  proxyUrl: { type: String, default: null },
  proxyType: { type: String, enum: ["http", "https", "socks4", "socks5"], default: null },
  connectedAt: { type: String, default: null },
  lastActiveAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

SessionSchema.index({ organizationId: 1, name: 1 }, { unique: true });
SessionSchema.index({ organizationId: 1, status: 1 });
SessionSchema.plugin(softDeletePlugin);

export const Session = mongoose.models.Session ?? mongoose.model<ISession>("Session", SessionSchema);

// ── Message ─────────────────────────────────────────────────

export interface IMessage extends Document<string> {
  organizationId: string;
  sessionId: string;
  waMessageId: string | null;
  chatId: string;
  from: string;
  to: string;
  body: string | null;
  type: string;
  direction: "incoming" | "outgoing";
  timestamp: number | null;
  metadata: Record<string, unknown> | null;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

const MessageSchema = new Schema<IMessage>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  waMessageId: { type: String, default: null },
  chatId: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  body: { type: String, default: null },
  type: { type: String, default: "text" },
  direction: { type: String, enum: ["incoming", "outgoing"], required: true },
  timestamp: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  status: { type: String, enum: ["pending", "sent", "delivered", "read", "failed"], default: "pending", index: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

MessageSchema.index({ sessionId: 1, chatId: 1, createdAt: -1 });
MessageSchema.index({ sessionId: 1, createdAt: -1 });
MessageSchema.plugin(softDeletePlugin);

export const Message = mongoose.models.Message ?? mongoose.model<IMessage>("Message", MessageSchema);

// ── Webhook ─────────────────────────────────────────────────

export interface IWebhook extends Document<string> {
  organizationId: string;
  sessionId: string;
  url: string;
  events: string[];
  secret: string | null;
  headers: Record<string, string>;
  active: boolean;
  retryCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const WebhookSchema = new Schema<IWebhook>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  url: { type: String, required: true },
  events: { type: [String], default: ["message.received"] },
  secret: { type: String, default: null },
  headers: { type: Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
  retryCount: { type: Number, default: 3 },
  lastTriggeredAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

WebhookSchema.index({ sessionId: 1, active: 1 });
WebhookSchema.plugin(softDeletePlugin);

export const Webhook = mongoose.models.Webhook ?? mongoose.model<IWebhook>("Webhook", WebhookSchema);

// ── Contact ─────────────────────────────────────────────────

export interface IContact extends Document<string> {
  organizationId: string;
  sessionId: string;
  waContactId: string;
  name: string | null;
  pushName: string | null;
  phone: string | null;
  isMyContact: boolean;
  isBlocked: boolean;
  profilePicUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const ContactSchema = new Schema<IContact>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  waContactId: { type: String, required: true },
  name: { type: String, default: null },
  pushName: { type: String, default: null },
  phone: { type: String, default: null },
  isMyContact: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  profilePicUrl: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

ContactSchema.index({ sessionId: 1, waContactId: 1 }, { unique: true });
ContactSchema.index({ organizationId: 1, phone: 1 });
ContactSchema.plugin(softDeletePlugin);

export const Contact = mongoose.models.Contact ?? mongoose.model<IContact>("Contact", ContactSchema);

// ── Group ───────────────────────────────────────────────────

export interface IGroup extends Document<string> {
  organizationId: string;
  sessionId: string;
  groupId: string;
  name: string;
  description: string | null;
  owner: string | null;
  participants: string[];
  admins: string[];
  createdAt: string;
  updatedAt: string;
}

const GroupSchema = new Schema<IGroup>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  groupId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  owner: { type: String, default: null },
  participants: { type: [String], default: [] },
  admins: { type: [String], default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

GroupSchema.index({ sessionId: 1, groupId: 1 }, { unique: true });
GroupSchema.plugin(softDeletePlugin);

export const Group = mongoose.models.Group ?? mongoose.model<IGroup>("Group", GroupSchema);

// ── API Key ─────────────────────────────────────────────────

export interface IApiKey extends Document<string> {
  organizationId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  role: "admin" | "operator" | "viewer";
  allowedIps: string[] | null;
  allowedSessions: string[] | null;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const ApiKeySchema = new Schema<IApiKey>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  keyPrefix: { type: String, required: true },
  role: { type: String, enum: ["admin", "operator", "viewer"], default: "operator" },
  allowedIps: { type: [String], default: null },
  allowedSessions: { type: [String], default: null },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: String, default: null },
  lastUsedAt: { type: String, default: null },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

// keyHash unique index auto-created by `unique: true` in schema field
ApiKeySchema.index({ organizationId: 1, isActive: 1 });
ApiKeySchema.plugin(softDeletePlugin);

export const ApiKey = mongoose.models.ApiKey ?? mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

// ── Audit Log ───────────────────────────────────────────────

export interface IAuditLog extends Document<string> {
  organizationId: string;
  action: string;
  severity: "info" | "warn" | "error";
  userId: string | null;
  userEmail: string | null;
  apiKeyId: string | null;
  apiKeyName: string | null;
  sessionId: string | null;
  sessionName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  action: { type: String, required: true, index: true },
  severity: { type: String, enum: ["info", "warn", "error"], default: "info" },
  userId: { type: String, default: null },
  userEmail: { type: String, default: null },
  apiKeyId: { type: String, default: null },
  apiKeyName: { type: String, default: null },
  sessionId: { type: String, default: null },
  sessionName: { type: String, default: null },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  method: { type: String, default: null },
  path: { type: String, default: null },
  statusCode: { type: Number, default: null },
  metadata: { type: Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, action: 1 });
// TTL: auto-delete after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Note: AuditLog intentionally does NOT use soft-delete — append-only log

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

// ── Batch Job (Bulk Messaging) ──────────────────────────────

export interface IBatchJob extends Document<string> {
  organizationId: string;
  sessionId: string;
  batchId: string;
  status: "pending" | "processing" | "completed" | "cancelled" | "failed";
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  cancelledCount: number;
  messages: Array<{
    chatId: string;
    type: string;
    content: Record<string, unknown>;
    variables?: Record<string, string>;
    status: string;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
    sentAt?: string;
  }>;
  options: {
    delayBetweenMessages: number;
    randomizeDelay: boolean;
    stopOnError: boolean;
  };
  progress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    cancelled: number;
  };
  currentIndex: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const BatchJobSchema = new Schema<IBatchJob>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  batchId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "processing", "completed", "cancelled", "failed"], default: "pending", index: true },
  totalMessages: { type: Number, required: true },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  cancelledCount: { type: Number, default: 0 },
  messages: { type: [Schema.Types.Mixed] as any, default: [] },
  options: {
    delayBetweenMessages: { type: Number, default: 1000 },
    randomizeDelay: { type: Boolean, default: true },
    stopOnError: { type: Boolean, default: false },
  },
  progress: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
  },
  currentIndex: { type: Number, default: 0 },
  error: { type: String, default: null },
  startedAt: { type: String, default: null },
  completedAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

BatchJobSchema.index({ organizationId: 1, status: 1 });
BatchJobSchema.index({ organizationId: 1, createdAt: -1 });
BatchJobSchema.plugin(softDeletePlugin);

export const BatchJob = mongoose.models.BatchJob ?? mongoose.model<IBatchJob>("BatchJob", BatchJobSchema);

// ── Message Template ────────────────────────────────────────

export interface IMessageTemplate extends Document<string> {
  organizationId: string;
  name: string;
  category: string;
  language: string;
  body: string;
  variables: string[];
  header: string | null;
  headerType: "text" | "image" | "video" | "document" | null;
  footer: string | null;
  buttons: Array<{
    type: "quick_reply" | "url" | "phone";
    text: string;
    value: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: "marketing" },
  language: { type: String, default: "en" },
  body: { type: String, required: true },
  variables: { type: [String], default: [] },
  header: { type: String, default: null },
  headerType: { type: String, enum: ["text", "image", "video", "document", null], default: null },
  footer: { type: String, default: null },
  buttons: {
    type: [{
      type: { type: String, enum: ["quick_reply", "url", "phone"] },
      text: { type: String },
      value: { type: String },
    }],
    default: [],
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

MessageTemplateSchema.index({ organizationId: 1, category: 1 });
MessageTemplateSchema.index({ organizationId: 1, name: 1 });
MessageTemplateSchema.plugin(softDeletePlugin);

export const MessageTemplate = mongoose.models.MessageTemplate ?? mongoose.model<IMessageTemplate>("MessageTemplate", MessageTemplateSchema);

// ── Campaign ────────────────────────────────────────────────

export interface ICampaign extends Document<string> {
  organizationId: string;
  sessionId: string;
  name: string;
  description: string | null;
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled";
  templateId: string | null;
  templateName: string | null;
  audienceType: "all_contacts" | "group" | "custom_list" | "tag";
  audienceFilter: Record<string, unknown>;
  audienceCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}

const CampaignSchema = new Schema<ICampaign>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  status: {
    type: String,
    enum: ["draft", "scheduled", "running", "paused", "completed", "cancelled"],
    default: "draft",
    index: true,
  },
  templateId: { type: String, default: null },
  templateName: { type: String, default: null },
  audienceType: { type: String, enum: ["all_contacts", "group", "custom_list", "tag"], default: "all_contacts" },
  audienceFilter: { type: Schema.Types.Mixed, default: {} },
  audienceCount: { type: Number, default: 0 },
  scheduledAt: { type: String, default: null },
  startedAt: { type: String, default: null },
  completedAt: { type: String, default: null },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

CampaignSchema.index({ organizationId: 1, status: 1 });
CampaignSchema.index({ organizationId: 1, createdAt: -1 });
CampaignSchema.plugin(softDeletePlugin);

export const Campaign = mongoose.models.Campaign ?? mongoose.model<ICampaign>("Campaign", CampaignSchema);

// ── Automation Rule ─────────────────────────────────────────

export interface IAutomationRule extends Document<string> {
  organizationId: string;
  sessionId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: "keyword" | "incoming_message" | "schedule" | "event" | "no_reply";
  triggerConfig: Record<string, unknown>;
  conditions: Array<{
    field: string;
    operator: "equals" | "contains" | "starts_with" | "ends_with" | "regex" | "greater_than" | "less_than";
    value: string;
  }>;
  actions: Array<{
    type: "send_message" | "send_template" | "add_label" | "remove_label" | "assign_agent" | "webhook" | "delay";
    config: Record<string, unknown>;
  }>;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const AutomationRuleSchema = new Schema<IAutomationRule>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  triggerType: {
    type: String,
    enum: ["keyword", "incoming_message", "schedule", "event", "no_reply"],
    required: true,
  },
  triggerConfig: { type: Schema.Types.Mixed, default: {} },
  conditions: {
    type: [{
      field: { type: String },
      operator: { type: String, enum: ["equals", "contains", "starts_with", "ends_with", "regex", "greater_than", "less_than"] },
      value: { type: String },
    }],
    default: [],
  },
  actions: {
    type: [{
      type: { type: String, enum: ["send_message", "send_template", "add_label", "remove_label", "assign_agent", "webhook", "delay"] },
      config: { type: Schema.Types.Mixed },
    }],
    default: [],
  },
  executionCount: { type: Number, default: 0 },
  lastExecutedAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

AutomationRuleSchema.index({ organizationId: 1, sessionId: 1, isActive: 1 });
AutomationRuleSchema.plugin(softDeletePlugin);

export const AutomationRule = mongoose.models.AutomationRule ?? mongoose.model<IAutomationRule>("AutomationRule", AutomationRuleSchema);

// ── Label ───────────────────────────────────────────────────

export interface ILabel extends Document<string> {
  organizationId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const LabelSchema = new Schema<ILabel>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, default: "#6366f1" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

LabelSchema.index({ organizationId: 1, name: 1 }, { unique: true });
LabelSchema.plugin(softDeletePlugin);

export const Label = mongoose.models.Label ?? mongoose.model<ILabel>("Label", LabelSchema);

// ── Activity Log ────────────────────────────────────────────

export interface IActivityLog extends Document<string> {
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

ActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
ActivityLogSchema.index({ organizationId: 1, userId: 1 });
// TTL: auto-delete after 180 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const ActivityLog = mongoose.models.ActivityLog ?? mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
