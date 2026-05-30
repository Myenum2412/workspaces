/**
 * OpenWA Message Service — migrated from OpenWA's message.service.ts + bulk-message.service.ts
 * Handles all message types, bulk messaging, batch jobs.
 */

import crypto from "crypto";
import { connectDB } from "../config/connection.js";
import { Message, BatchJob } from "../models/openwa.js";
import { AuditLog } from "../models/openwa.js";
import { openwaSessions } from "./openwa-session.js";

// ── Types ────────────────────────────────────────────────────

export interface SendTextDto {
  chatId: string;
  text: string;
}

export interface SendMediaDto {
  chatId: string;
  url?: string;
  base64?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
}

export interface SendBulkDto {
  batchId?: string;
  messages: Array<{
    chatId: string;
    type: string;
    content: Record<string, unknown>;
    variables?: Record<string, string>;
  }>;
  options?: {
    delayBetweenMessages?: number;
    randomizeDelay?: boolean;
    stopOnError?: boolean;
  };
}

interface BulkMessageContent {
  text?: string;
  caption?: string;
  image?: { url?: string; base64?: string; mimetype?: string };
  video?: { url?: string; base64?: string; mimetype?: string };
  audio?: { url?: string; base64?: string; mimetype?: string };
  document?: { url?: string; base64?: string; mimetype?: string; filename?: string };
}

// ── Service ──────────────────────────────────────────────────

class OpenWAMessageService {
  private processingBatches = new Map<string, boolean>();

  // ── Text ──────────────────────────────────────────────────

  async sendText(organizationId: string, sessionId: string, dto: SendTextDto) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: dto.text });

    if (result) {
      await Message.findOneAndUpdate(
        { _id: result.key.id },
        {
          _id: result.key.id,
          organizationId,
          sessionId,
          waMessageId: result.key.id,
          chatId: jid,
          from: sock.user.id,
          to: jid,
          body: dto.text,
          type: "text",
          direction: "outgoing",
          timestamp: result.messageTimestamp || Date.now(),
          status: "sent",
          createdAt: new Date().toISOString(),
        },
        { upsert: true }
      );
    }

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── Media ─────────────────────────────────────────────────

  async sendMedia(organizationId: string, sessionId: string, dto: SendMediaDto, messageType: "image" | "video" | "audio" | "document") {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    if (!dto.url && !dto.base64) throw new Error("url or base64 required");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    const mediaData = dto.url || dto.base64 || "";
    const mimetype = dto.mimetype || this.defaultMimetype(messageType);

    let content: any;
    const msgOptions: any = { mimetype, caption: dto.caption };

    if (messageType === "image") {
      content = dto.url ? { url: mediaData } : { data: Buffer.from(mediaData, "base64") };
      content = { image: content, ...msgOptions };
    } else if (messageType === "video") {
      content = dto.url ? { url: mediaData } : { data: Buffer.from(mediaData, "base64") };
      content = { video: content, ...msgOptions, gifPlayback: false };
    } else if (messageType === "audio") {
      content = dto.url ? { url: mediaData } : { data: Buffer.from(mediaData, "base64") };
      content = { audio: content, mimetype };
    } else {
      content = dto.url ? { url: mediaData } : { data: Buffer.from(mediaData, "base64") };
      content = { document: content, mimetype, fileName: dto.filename };
    }

    const result = await sock.sendMessage(jid, content);

    if (result) {
      await Message.findOneAndUpdate(
        { _id: result.key.id },
        {
          _id: result.key.id,
          organizationId,
          sessionId,
          waMessageId: result.key.id,
          chatId: jid,
          from: sock.user.id,
          to: jid,
          body: dto.caption || `[${messageType}]`,
          type: messageType,
          direction: "outgoing",
          timestamp: result.messageTimestamp || Date.now(),
          status: "sent",
          createdAt: new Date().toISOString(),
        },
        { upsert: true }
      );
    }

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── Location ──────────────────────────────────────────────

  async sendLocation(organizationId: string, sessionId: string, dto: { chatId: string; latitude: number; longitude: number; description?: string; address?: string }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, {
      location: { degreesLatitude: dto.latitude, degreesLongitude: dto.longitude, name: dto.description, address: dto.address },
    });

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── Reply ─────────────────────────────────────────────────

  async reply(organizationId: string, sessionId: string, dto: { chatId: string; quotedMessageId: string; text: string }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, {
      text: dto.text,
      contextInfo: { stanzaId: dto.quotedMessageId, participant: jid },
    } as any);

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── Forward ───────────────────────────────────────────────

  async forward(organizationId: string, sessionId: string, dto: { fromChatId: string; toChatId: string; messageId: string }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const fromJid = dto.fromChatId.includes("@") ? dto.fromChatId : `${dto.fromChatId}@s.whatsapp.net`;
    const toJid = dto.toChatId.includes("@") ? dto.toChatId : `${dto.toChatId}@s.whatsapp.net`;

    // Fetch the original message using Baileys store or fetchMessage
    let originalMsg: any = null;
    try {
      // Try fetching from Baileys message store
      const store = (sock as any).store;
      if (store?.messages) {
        const chatMsgs = store.messages[fromJid];
        if (chatMsgs) {
          originalMsg = chatMsgs.get(dto.messageId) || Object.values(chatMsgs).find((m: any) => m?.key?.id === dto.messageId);
        }
      }
    } catch { /* ignore */ }

    if (!originalMsg) {
      // Fallback: send as text reference
      const result = await sock.sendMessage(toJid, { text: `[Forwarded from ${dto.fromChatId}] Message ID: ${dto.messageId}` });
      return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
    }

    const result = await sock.sendMessage(toJid, { forward: originalMsg });

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── React ─────────────────────────────────────────────────

  async react(organizationId: string, sessionId: string, dto: { chatId: string; messageId: string; emoji: string }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    await sock.sendMessage(jid, {
      react: { key: { remoteJid: jid, id: dto.messageId, fromMe: false }, text: dto.emoji },
    });
  }

  // ── Delete Message ────────────────────────────────────────

  async deleteMessage(organizationId: string, sessionId: string, dto: { chatId: string; messageId: string; forEveryone?: boolean }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    if (dto.forEveryone) {
      await sock.sendMessage(jid, { delete: { remoteJid: jid, id: dto.messageId, fromMe: true } });
    } else {
      // Delete for me only
      await sock.chatModify({ delete: true, lastMessages: [{ key: { id: dto.messageId, fromMe: true }, messageTimestamp: Math.floor(Date.now() / 1000) }] }, jid);
    }
    // Update DB status
    await Message.updateOne({ _id: dto.messageId, organizationId }, { status: "deleted", updatedAt: new Date().toISOString() }).catch(() => {});
  }

  // ── Send Sticker ──────────────────────────────────────────

  async sendSticker(organizationId: string, sessionId: string, dto: { chatId: string; url?: string; base64?: string }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    if (!dto.url && !dto.base64) throw new Error("url or base64 required");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    let stickerContent: any;
    if (dto.url) {
      stickerContent = { url: dto.url };
    } else if (dto.base64) {
      stickerContent = Buffer.from(dto.base64, "base64");
    } else {
      throw new Error("url or base64 required");
    }
    const result = await sock.sendMessage(jid, { sticker: stickerContent });

    return { messageId: result?.key.id, timestamp: result?.messageTimestamp || Date.now() };
  }

  // ── Send Contact ──────────────────────────────────────────

  async sendContact(organizationId: string, sessionId: string, dto: { chatId: string; contacts: Array<{ name: string; phone: string; organization?: string }> }) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = dto.chatId.includes("@") ? dto.chatId : `${dto.chatId}@s.whatsapp.net`;
    for (const c of dto.contacts) {
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nORG:${c.organization || ""}\nTEL;type=CELL;type=VOICE;waid=${c.phone}:${c.phone}\nEND:VCARD`;
      await sock.sendMessage(jid, { contacts: { contacts: [{ displayName: c.name, vcard }] } });
    }
    return { success: true, count: dto.contacts.length };
  }

  // ── Get Messages ──────────────────────────────────────────

  async getMessages(organizationId: string, sessionId: string, chatId: string, limit = 50, offset = 0) {
    await connectDB();
    const messages = await Message.find({ organizationId, sessionId, chatId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
    const total = await Message.countDocuments({ organizationId, sessionId, chatId });
    return { messages, total };
  }

  async searchMessages(organizationId: string, query: string, limit = 50) {
    await connectDB();
    return Message.find({
      organizationId,
      $or: [
        { messageText: { $regex: query, $options: "i" } },
        { senderName: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // ── Bulk Messaging ────────────────────────────────────────

  async createBatch(organizationId: string, sessionId: string, dto: SendBulkDto) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const batchId = dto.batchId || `batch_${crypto.randomUUID().split("-")[0]}`;
    const existing = await BatchJob.findOne({ batchId }).lean();
    if (existing) throw new Error(`Batch ID '${batchId}' already exists`);

    const options = {
      delayBetweenMessages: dto.options?.delayBetweenMessages ?? 2000,
      randomizeDelay: dto.options?.randomizeDelay ?? true,
      stopOnError: dto.options?.stopOnError ?? false,
    };

    const batchMessages = dto.messages.map((m) => ({
      chatId: m.chatId,
      type: m.type,
      content: m.content,
      variables: m.variables,
      status: "pending" as const,
    }));

    const batch = await BatchJob.create({
      _id: crypto.randomUUID(),
      organizationId,
      sessionId,
      batchId,
      status: "pending",
      totalMessages: dto.messages.length,
      messages: batchMessages,
      options,
      progress: {
        total: dto.messages.length,
        sent: 0,
        failed: 0,
        pending: dto.messages.length,
        cancelled: 0,
      },
    });

    // Process asynchronously
    this.processBatch(batch._id).catch(() => {});

    return batch;
  }

  async getBatchStatus(batchId: string) {
    await connectDB();
    const batch = await BatchJob.findOne({ batchId }).lean();
    if (!batch) throw new Error("Batch not found");
    return batch;
  }

  async cancelBatch(batchId: string) {
    await connectDB();
    const batch = await BatchJob.findOne({ batchId });
    if (!batch) throw new Error("Batch not found");
    if (batch.status === "completed" || batch.status === "cancelled") throw new Error(`Batch already ${batch.status}`);

    this.processingBatches.set(batch._id.toString(), false);
    batch.status = "cancelled";
    batch.progress.cancelled = batch.progress.pending;
    batch.progress.pending = 0;
    batch.completedAt = new Date().toISOString();
    await batch.save();
    return batch;
  }

  async getBatches(organizationId: string, sessionId?: string) {
    await connectDB();
    const filter: any = { organizationId };
    if (sessionId) filter.sessionId = sessionId;
    return BatchJob.find(filter).sort({ createdAt: -1 }).lean();
  }

  // ── Batch Processing ──────────────────────────────────────

  private async processBatch(batchDbId: string) {
    const batch = await BatchJob.findById(batchDbId);
    if (!batch) return;

    this.processingBatches.set(batch._id.toString(), true);
    batch.status = "processing";
    batch.startedAt = new Date().toISOString();
    await batch.save();

    const sock = openwaSessions.getSocket(batch.sessionId);
    if (!sock) {
      batch.status = "failed";
      batch.completedAt = new Date().toISOString();
      batch.error = "Session engine disconnected";
      await batch.save();
      return;
    }

    for (let i = batch.currentIndex; i < batch.messages.length; i++) {
      if (!this.processingBatches.get(batch._id.toString())) break;

      const msg = batch.messages[i];
      const content = this.applyVariables(msg.content as BulkMessageContent, msg.variables);
      const chatId = msg.chatId.includes("@") ? msg.chatId : `${msg.chatId}@s.whatsapp.net`;

      try {
        await this.sendBulkMessage(sock, chatId, msg.type, content);
        msg.status = "sent";
        msg.sentAt = new Date().toISOString();
        batch.progress.sent++;
        batch.progress.pending--;
      } catch (err: any) {
        msg.status = "failed";
        msg.errorCode = "SEND_FAILED";
        msg.errorMessage = String(err);
        batch.progress.failed++;
        batch.progress.pending--;
        if (batch.options.stopOnError) { break; }
      }

      batch.currentIndex = i + 1;
      if (i % 10 === 0 || i === batch.messages.length - 1) await batch.save();

      if (i < batch.messages.length - 1 && this.processingBatches.get(batch._id.toString())) {
        const delay = this.calculateDelay(batch.options);
        await this.sleep(delay);
      }
    }

    if (this.processingBatches.get(batch._id.toString())) {
      batch.status = batch.progress.failed > 0 && batch.progress.sent === 0 ? "failed" : "completed";
    }
    batch.completedAt = new Date().toISOString();
    await batch.save();
    this.processingBatches.delete(batch._id.toString());
  }

  private async sendBulkMessage(sock: any, chatId: string, type: string, content: BulkMessageContent) {
    switch (type) {
      case "text":
        return sock.sendMessage(chatId, { text: content.text || "" });
      case "image": {
        const imgData = content.image?.url || content.image?.base64 || "";
        const img = content.image?.url ? { url: imgData } : { data: Buffer.from(imgData, "base64") };
        return sock.sendMessage(chatId, { image: img, caption: content.caption, mimetype: content.image?.mimetype || "image/jpeg" });
      }
      case "video": {
        const vidData = content.video?.url || content.video?.base64 || "";
        const vid = content.video?.url ? { url: vidData } : { data: Buffer.from(vidData, "base64") };
        return sock.sendMessage(chatId, { video: vid, caption: content.caption, mimetype: content.video?.mimetype || "video/mp4" });
      }
      case "audio": {
        const audData = content.audio?.url || content.audio?.base64 || "";
        const aud = content.audio?.url ? { url: audData } : { data: Buffer.from(audData, "base64") };
        return sock.sendMessage(chatId, { audio: aud, mimetype: content.audio?.mimetype || "audio/mpeg" });
      }
      case "document": {
        const docData = content.document?.url || content.document?.base64 || "";
        const doc = content.document?.url ? { url: docData } : { data: Buffer.from(docData, "base64") };
        return sock.sendMessage(chatId, { document: doc, mimetype: content.document?.mimetype || "application/octet-stream", fileName: content.document?.filename, caption: content.caption });
      }
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  private applyVariables(content: BulkMessageContent, variables?: Record<string, string>): BulkMessageContent {
    if (!variables) return content;
    const replace = (str: string): string => str.replace(/\{(\w+)\}/g, (_, k) => variables[k] || `{${k}}`);
    const process = (val: any): any => {
      if (typeof val === "string") return replace(val);
      if (Array.isArray(val)) return val.map(process);
      if (typeof val === "object" && val !== null) {
        const result: any = {};
        for (const [k, v] of Object.entries(val)) result[k] = process(v);
        return result;
      }
      return val;
    };
    return process(content) as BulkMessageContent;
  }

  private calculateDelay(opts: { delayBetweenMessages: number; randomizeDelay: boolean }): number {
    let d = opts.delayBetweenMessages;
    if (opts.randomizeDelay) d += Math.random() * 2000;
    return d;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ── Helper ────────────────────────────────────────────────

  private defaultMimetype(type: string): string {
    const map: Record<string, string> = {
      image: "image/jpeg",
      video: "video/mp4",
      audio: "audio/mpeg",
      document: "application/octet-stream",
    };
    return map[type] || "application/octet-stream";
  }
}

export const openwaMessages = new OpenWAMessageService();
