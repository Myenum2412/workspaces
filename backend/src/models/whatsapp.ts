import mongoose, { Schema, Document, Model } from "mongoose";
import { softDeletePlugin } from "../middleware/soft-delete.js";

// ── WhatsApp Instance ──────────────────────────────────────

export interface IWhatsappInstance extends Document<string> {
  organizationId: string;
  workspaceOwnerId: string;
  instanceName: string;
  connectionStatus: "disconnected" | "connecting" | "connected" | "reconnecting";
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  disconnectReason?: string;
  authState?: { creds: any; keys: any };
  phoneNumber?: string;
  pushName?: string;
  profilePicUrl?: string;
  autoReconnect: boolean;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const WhatsappInstanceSchema = new Schema<IWhatsappInstance>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  workspaceOwnerId: { type: String, required: true },
  instanceName: { type: String, required: true, default: "WhatsApp" },
  connectionStatus: {
    type: String,
    enum: ["disconnected", "connecting", "connected", "reconnecting"],
    default: "disconnected",
    index: true,
  },
  lastConnectedAt: String,
  lastDisconnectedAt: String,
  disconnectReason: String,
  authState: { creds: Schema.Types.Mixed, keys: Schema.Types.Mixed },
  phoneNumber: String,
  pushName: String,
  profilePicUrl: String,
  autoReconnect: { type: Boolean, default: true },
  webhookUrl: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

WhatsappInstanceSchema.index({ organizationId: 1 }, { unique: true });
WhatsappInstanceSchema.plugin(softDeletePlugin);

export const WhatsappInstance =
  mongoose.models.WhatsappInstance ??
  mongoose.model<IWhatsappInstance>("WhatsappInstance", WhatsappInstanceSchema);

// ── WhatsApp Message ────────────────────────────────────────

export interface IWhatsappMessage extends Document<string> {
  organizationId: string;
  instanceId: string;
  messageId: string;
  jid: string;
  fromMe: boolean;
  senderJid: string;
  senderName?: string;
  messageType: string;
  messageText?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  replyToMessageId?: string;
  replyToText?: string;
  createdAt: string;
}

const WhatsappMessageSchema = new Schema<IWhatsappMessage>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  instanceId: { type: String, required: true, index: true },
  messageId: { type: String, required: true },
  jid: { type: String, required: true },
  fromMe: { type: Boolean, default: false },
  senderJid: { type: String, required: true },
  senderName: String,
  messageType: { type: String, default: "text" },
  messageText: String,
  mediaUrl: String,
  mediaThumbnail: String,
  mediaMimeType: String,
  mediaFileName: String,
  mediaFileSize: Number,
  status: { type: String, default: "pending" },
  sentAt: String,
  deliveredAt: String,
  readAt: String,
  replyToMessageId: String,
  replyToText: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

WhatsappMessageSchema.index({ organizationId: 1, jid: 1, createdAt: -1 });
WhatsappMessageSchema.plugin(softDeletePlugin);

export const WhatsappMessage =
  mongoose.models.WhatsappMessage ??
  mongoose.model<IWhatsappMessage>("WhatsappMessage", WhatsappMessageSchema);

// ── WhatsApp Chat ───────────────────────────────────────────

export interface IWhatsappChat extends Document<string> {
  organizationId: string;
  instanceId: string;
  jid: string;
  name?: string;
  isGroup: boolean;
  lastMessageId?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSender?: string;
  lastMessageType?: string;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  muteUntil?: string;
  isPinned: boolean;
  profilePicUrl?: string;
  updatedAt: string;
  createdAt: string;
}

const WhatsappChatSchema = new Schema<IWhatsappChat>({
  _id: { type: String },
  organizationId: { type: String, required: true },
  instanceId: { type: String, required: true },
  jid: { type: String, required: true },
  name: String,
  isGroup: { type: Boolean, default: false },
  lastMessageId: String,
  lastMessageText: String,
  lastMessageAt: String,
  lastMessageSender: String,
  lastMessageType: String,
  unreadCount: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  muteUntil: String,
  isPinned: { type: Boolean, default: false },
  profilePicUrl: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

WhatsappChatSchema.index({ instanceId: 1, jid: 1 }, { unique: true });
WhatsappChatSchema.plugin(softDeletePlugin);

export const WhatsappChat =
  mongoose.models.WhatsappChat ??
  mongoose.model<IWhatsappChat>("WhatsappChat", WhatsappChatSchema);
