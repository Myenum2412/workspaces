/**
 * OpenWA Session Service — migrated from OpenWA's session.service.ts
 * Manages WhatsApp session lifecycle with exponential backoff reconnect.
 */

import crypto from "crypto";
import { Session } from "../models/openwa.js";
import { AuditLog } from "../models/openwa.js";
import type { AuthRequest } from "../middleware/auth.js";
import { Server as SocketIOServer } from "socket.io";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  WASocket,
  BaileysEventMap,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { connectDB } from "../config/connection.js";
import { WhatsappChat } from "../models/whatsapp.js";
import { Message } from "../models/openwa.js";

// ── Types ────────────────────────────────────────────────────

interface WASocketExtended extends WASocket {
  organizationId?: string;
}

interface ReconnectState {
  attempts: number;
  timer: NodeJS.Timeout | null;
  maxAttempts: number;
  baseDelay: number;
}

type SessionWithAuth = {
  _id: string;
  organizationId: string;
  name: string;
  config: Record<string, unknown>;
};

// ── Service ──────────────────────────────────────────────────

class OpenWASessionService {
  private sockets: Map<string, WASocketExtended> = new Map();
  private reconnectStates: Map<string, ReconnectState> = new Map();
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  private emit(sessionId: string, event: string, data: unknown) {
    if (this.io) {
      this.io.to(`session:${sessionId}`).emit(event, data);
      this.io.to("all-sessions").emit(event, { sessionId, ...(data as object) });
    }
  }

  private emitOrg(orgId: string, event: string, data: unknown) {
    if (this.io) {
      this.io.to(`org:${orgId}`).emit(event, data);
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────

  async onStartup() {
    await connectDB();
    // Mark all active sessions as disconnected on startup
    const activeStatuses = ["ready", "initializing", "qr_ready", "authenticating"];
    await Session.updateMany(
      { status: { $in: activeStatuses } },
      { status: "disconnected", updatedAt: new Date().toISOString() }
    );
  }

  async onShutdown() {
    for (const [id, sock] of this.sockets) {
      try { await sock.logout(); } catch { /* ignore */ }
      this.sockets.delete(id);
    }
    this.sockets.clear();
    for (const [, state] of this.reconnectStates) {
      if (state.timer) clearTimeout(state.timer);
    }
    this.reconnectStates.clear();
  }

  // ── CRUD ───────────────────────────────────────────────────

  async createSession(
    organizationId: string,
    name: string,
    config: Record<string, unknown> = {}
  ) {
    await connectDB();
    const existing = await Session.findOne({ organizationId, name }).lean();
    if (existing) throw new Error(`Session '${name}' already exists in this workspace`);

    const session = await Session.create({
      _id: crypto.randomUUID(),
      organizationId,
      name,
      config,
      status: "created",
    });

    await this.logAudit(organizationId, "session.created", null, null, session.id, session.name);
    return session;
  }

  async getSessions(organizationId: string) {
    await connectDB();
    return Session.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  async getSession(sessionId: string, organizationId: string): Promise<any> {
    await connectDB();
    return Session.findOne({ _id: sessionId, organizationId }).lean();
  }

  async deleteSession(sessionId: string, organizationId: string) {
    await connectDB();
    const session = await Session.findOne({ _id: sessionId, organizationId }).lean() as any;
    if (!session) throw new Error("Session not found");

    this.cancelReconnect(sessionId);
    const sock = this.sockets.get(sessionId);
    if (sock) {
      try { await sock.logout(); } catch { /* ignore */ }
      this.sockets.delete(sessionId);
    }

    await Session.deleteOne({ _id: sessionId, organizationId });
    await this.logAudit(organizationId, "session.deleted", null, null, sessionId, session.name);
  }

  // ── Connect / Disconnect ──────────────────────────────────

  async startSession(sessionId: string, organizationId: string) {
    await connectDB();
    const session = await Session.findOne({ _id: sessionId, organizationId });
    if (!session) throw new Error("Session not found");
    if (this.sockets.has(sessionId)) throw new Error("Session already started");

    const maxReconnect = (session.config as any)?.maxReconnectAttempts ?? 5;
    const baseDelay = (session.config as any)?.reconnectBaseDelay ?? 5000;
    this.reconnectStates.set(sessionId, { attempts: 0, timer: null, maxAttempts: maxReconnect, baseDelay });

    await this.initializeEngine(session as any);
    return this.getSession(sessionId, organizationId);
  }

  async stopSession(sessionId: string, organizationId: string) {
    await connectDB();
    const session = await Session.findOne({ _id: sessionId, organizationId });
    if (!session) throw new Error("Session not found");

    this.cancelReconnect(sessionId);
    const sock = this.sockets.get(sessionId);
    if (sock) {
      try { await sock.end(undefined as any); } catch { /* ignore */ }
      this.sockets.delete(sessionId);
    }

    await Session.updateOne(
      { _id: sessionId },
      { status: "disconnected", updatedAt: new Date().toISOString() }
    );
    this.emit(sessionId, "session.status", { status: "disconnected" });
    return this.getSession(sessionId, organizationId);
  }

  // ── Engine Initialization ─────────────────────────────────

  private async initializeEngine(session: { _id: string; organizationId: string; name: string; config: Record<string, unknown> }) {
    await Session.updateOne(
      { _id: session._id },
      { status: "initializing", updatedAt: new Date().toISOString() }
    );
    this.emit(session._id, "session.status", { status: "initializing" });

    const authDir = `./whatsapp_auth/${session.organizationId}/${session._id}`;
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console as any),
      },
      printQRInTerminal: false,
      browser: ["OpenWA Workspace", "Chrome", "1.0.0"],
      syncFullHistory: false,
      defaultQueryTimeoutMs: 60000,
    }) as WASocketExtended;

    sock.organizationId = session.organizationId;
    this.sockets.set(session._id, sock);

    // Connection handler
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr);
        await Session.updateOne(
          { _id: session._id },
          { status: "qr_ready", updatedAt: new Date().toISOString() }
        );
        this.emit(session._id, "session.qr", { qr: qrDataUrl });
        this.emitOrg(session.organizationId, "whatsapp:qr", { sessionId: session._id, qr: qrDataUrl });
      }

      if (connection === "open") {
        const phoneNumber = sock.user?.id?.split(":")[0];
        const pushName = sock.user?.name || null;
        await Session.updateOne(
          { _id: session._id },
          { status: "ready", phone: phoneNumber, pushName, connectedAt: new Date().toISOString(), lastActiveAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        );
        this.emit(session._id, "session.status", { status: "ready", phoneNumber, pushName });
        this.emitOrg(session.organizationId, "whatsapp:connection_update", { status: "connected", sessionId: session._id, phoneNumber, pushName, organizationId: session.organizationId });

        // Reset reconnect attempts
        const rs = this.reconnectStates.get(session._id);
        if (rs) rs.attempts = 0;
      }

      if (connection === "close") {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = reason === DisconnectReason.loggedOut;
        const newStatus = loggedOut ? "disconnected" : "disconnected";

        await Session.updateOne(
          { _id: session._id },
          { status: newStatus, updatedAt: new Date().toISOString() }
        );
        this.emit(session._id, "session.status", { status: newStatus });
        this.emitOrg(session.organizationId, "whatsapp:connection_update", { status: "disconnected", sessionId: session._id, reason: loggedOut ? "logged_out" : "connection_lost", organizationId: session.organizationId });

        this.sockets.delete(session._id);

        if (!loggedOut) {
          this.scheduleReconnect(session as any);
        }
      }
    });

    // Creds handler
    sock.ev.on("creds.update", saveCreds);

    // Message handler
    sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]) => {
      if (m.type !== "notify") return;
      for (const msg of m.messages) {
        if (!msg.key?.remoteJid) continue;
        await this.handleIncomingMessage(session, msg);
        // Dispatch webhooks for incoming messages
        if (!msg.key.fromMe) {
          const { openwaWebhooks } = await import("./openwa-webhooks.js");
          await openwaWebhooks.dispatch(session.organizationId, session._id, "message.received", {
            messageId: msg.key.id, from: msg.key.remoteJid,
            sender: msg.key.participant || msg.key.remoteJid,
            pushName: msg.pushName, timestamp: msg.messageTimestamp,
          });
        }
      }
    });

    // Message status updates (delivered/read)
    sock.ev.on("messages.update", async (updates: any[]) => {
      for (const update of updates) {
        if (update.key?.id) {
          const status = update.update?.status;
          if (status !== undefined) {
            // WhatsApp message status: 1=pending, 2=sent, 3=delivered, 4=read
            const statusMap: Record<number, string> = { 1: "sent", 2: "delivered", 3: "delivered", 4: "read" };
            await Message.updateOne(
              { _id: update.key.id, organizationId: session.organizationId },
              { status: statusMap[status] || "sent", updatedAt: new Date().toISOString() }
            ).catch(() => {});
          }
        }
      }
    });

    // Presence updates (typing, recording)
    sock.ev.on("presence.update", async (presences: any) => {
      this.emitOrg(session.organizationId, "whatsapp:presence", { sessionId: session._id, presences });
    });

    // Contact sync on connection
    sock.ev.on("contacts.update", async (contacts: any[]) => {
      const { Contact } = await import("../models/openwa.js");
      for (const c of contacts) {
        if (c.id && c.id.endsWith("@s.whatsapp.net")) {
          await Contact.findOneAndUpdate(
            { sessionId: session._id, waContactId: c.id },
            {
              $set: {
                name: c.name || null,
                pushName: c.notify || c.verifiedName || null,
                updatedAt: new Date().toISOString(),
              },
              $setOnInsert: {
                _id: crypto.randomUUID(),
                organizationId: session.organizationId,
                sessionId: session._id,
                waContactId: c.id,
                phone: c.id.split("@")[0],
                isMyContact: true,
                isBlocked: false,
                createdAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          ).catch(() => {});
        }
      }
    });

    // Chat handler
    sock.ev.on("chats.upsert", async (chats: any[]) => {
      for (const chat of chats) {
        await WhatsappChat.findOneAndUpdate(
          { organizationId: session.organizationId, jid: chat.id },
          {
            $set: {
              name: chat.name || chat.id.split("@")[0],
              isGroup: chat.id.endsWith("@g.us"),
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
              _id: crypto.randomUUID(),
              instanceId: session._id,
              jid: chat.id,
              unreadCount: 0,
              createdAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      }
    });

    // Chat update handler (for unread count, etc.)
    sock.ev.on("chats.update", async (updates: any[]) => {
      for (const chat of updates) {
        if (chat.unreadCount !== undefined) {
          await WhatsappChat.updateOne(
            { organizationId: session.organizationId, jid: chat.id },
            { unreadCount: chat.unreadCount }
          );
        }
      }
    });
  }

  // ── Incoming Message Handler ──────────────────────────────

  private async handleIncomingMessage(
    session: { _id: string; organizationId: string },
    msg: any
  ) {
    if (!msg.key?.id) return;

    const messageType = this.getMessageType(msg);
    const messageText = this.extractMessageText(msg);
    const jid = msg.key.remoteJid!;
    const fromMe = msg.key.fromMe || false;
    const senderJid = msg.key.participant || jid;
    const ts = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();

    await Message.findOneAndUpdate(
      { _id: msg.key.id },
      {
        _id: msg.key.id,
        organizationId: session.organizationId,
        instanceId: session._id,
        messageId: msg.key.id,
        jid,
        fromMe,
        senderJid,
        senderName: msg.pushName || "",
        messageType,
        messageText,
        status: "delivered",
        createdAt: new Date(ts).toISOString(),
      },
      { upsert: true }
    );

    // Update chat
    await WhatsappChat.findOneAndUpdate(
      { organizationId: session.organizationId, jid },
      {
        $set: {
          lastMessageId: msg.key.id,
          lastMessageText: (messageText || "").substring(0, 200),
          lastMessageAt: new Date().toISOString(),
          lastMessageSender: msg.pushName || "",
          lastMessageType: messageType,
          updatedAt: new Date().toISOString(),
        },
        $inc: { unreadCount: fromMe ? 0 : 1 },
        $setOnInsert: {
          _id: crypto.randomUUID(),
          instanceId: session._id,
          name: msg.pushName || jid.split("@")[0],
          isGroup: jid.endsWith("@g.us"),
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // Real-time emit
    this.emitOrg(session.organizationId, "whatsapp:new_message", {
      sessionId: session._id,
      organizationId: session.organizationId,
      message: { _id: msg.key.id, jid, fromMe, messageType, messageText, senderName: msg.pushName, createdAt: new Date(ts).toISOString() },
    });
  }

  // ── Reconnect Logic ──────────────────────────────────────

  private scheduleReconnect(session: { _id: string; organizationId: string; name: string; config: Record<string, unknown> }) {
    const state = this.reconnectStates.get(session._id);
    if (!state) return;
    if (state.attempts >= state.maxAttempts) return;

    const delay = state.baseDelay * Math.pow(2, state.attempts) + Math.random() * 1000;
    state.attempts++;

    state.timer = setTimeout(async () => {
      try {
        const oldSock = this.sockets.get(session._id);
        if (oldSock) {
          try { await oldSock.end(undefined as any); } catch { /* ignore */ }
          this.sockets.delete(session._id);
        }
        await this.initializeEngine(session);
      } catch {
        this.scheduleReconnect(session);
      }
    }, delay);
  }

  private cancelReconnect(sessionId: string) {
    const state = this.reconnectStates.get(sessionId);
    if (state?.timer) clearTimeout(state.timer);
    this.reconnectStates.delete(sessionId);
  }

  // ── Socket Access ─────────────────────────────────────────

  getSocket(sessionId: string): WASocket | undefined {
    return this.sockets.get(sessionId);
  }

  hasSocket(sessionId: string): boolean {
    return this.sockets.has(sessionId);
  }

  // ── Stats ─────────────────────────────────────────────────

  async getStats(organizationId: string) {
    await connectDB();
    const sessions = await Session.find({ organizationId }).lean();
    const byStatus: Record<string, number> = {};
    for (const s of sessions) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    }
    const mem = process.memoryUsage();
    return {
      total: sessions.length,
      active: this.sockets.size,
      ready: byStatus["ready"] || 0,
      disconnected: byStatus["disconnected"] || 0,
      byStatus,
      memoryUsage: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
    };
  }

  // ── Audit Helper ──────────────────────────────────────────

  private async logAudit(
    organizationId: string,
    action: string,
    userId: string | null,
    userEmail: string | null,
    sessionId: string | null,
    sessionName: string | null,
    metadata?: Record<string, unknown>
  ) {
    try {
      await AuditLog.create({
        _id: crypto.randomUUID(),
        organizationId,
        action,
        severity: "info",
        userId,
        userEmail,
        sessionId,
        sessionName,
        metadata: metadata || null,
        createdAt: new Date().toISOString(),
      });
    } catch { /* non-blocking */ }
  }

  // ── Message Helpers ──────────────────────────────────────

  private getMessageType(msg: any): string {
    if (!msg.message) return "unknown";
    const m = msg.message;
    if (m.conversation) return "text";
    if (m.extendedTextMessage) return "text";
    if (m.imageMessage) return "image";
    if (m.videoMessage) return "video";
    if (m.audioMessage) return "audio";
    if (m.documentMessage) return "document";
    if (m.stickerMessage) return "sticker";
    if (m.locationMessage) return "location";
    if (m.contactMessage) return "contact";
    if (m.liveLocationMessage) return "live_location";
    return "unknown";
  }

  private extractMessageText(msg: any): string {
    if (!msg.message) return "";
    const m = msg.message;
    return (
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      m.documentMessage?.fileName ||
      ""
    );
  }
}

export const openwaSessions = new OpenWASessionService();
