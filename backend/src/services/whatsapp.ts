/**
 * WhatsApp Service — Multi-tenant WhatsApp connection manager.
 * 
 * Uses Baileys (@whiskeysockets/baileys) under the hood.
 * Each workspace gets its own isolated WhatsApp instance.
 * 
 * Architecture:
 * - One Baileys socket per workspace
 * - Sessions stored in MongoDB (authState field on WhatsappInstance)
 * - QR codes generated on-demand and sent via Socket.io
 * - All messages/chats scoped by organizationId
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
  WAMessage,
  WASocket,
  BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import { WhatsappInstance, WhatsappMessage, WhatsappChat } from "../models/whatsapp.js";
import { connectDB } from "../config/connection.js";
import { Server as SocketIOServer } from "socket.io";

// ── Types ────────────────────────────────────────────────────

interface QRCodeData {
  qr: string;
  timestamp: string;
}

interface ConnectionUpdate {
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  phoneNumber?: string;
  pushName?: string;
  profilePicUrl?: string;
  reason?: string;
}

// ── Service ──────────────────────────────────────────────────

class WhatsappService {
  private sockets: Map<string, WASocket> = new Map();
  private io: SocketIOServer | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  private emitToOrg(organizationId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`org:${organizationId}`).emit(event, data);
    }
  }

  // ── Create Instance ──────────────────────────────────────

  async createInstance(
    organizationId: string,
    workspaceOwnerId: string,
    instanceName: string = "WhatsApp"
  ): Promise<any> {
    await connectDB();

    // Check if instance already exists for this org
    const existing = await WhatsappInstance.findOne({ organizationId }).lean();
    if (existing) {
      throw new Error("WhatsApp instance already exists for this workspace");
    }

    const instance = await WhatsappInstance.create({
      _id: crypto.randomUUID(),
      organizationId,
      workspaceOwnerId,
      instanceName,
      connectionStatus: "disconnected",
      autoReconnect: true,
    });

    return instance;
  }

  // ── Get Instance ─────────────────────────────────────────

  async getInstance(organizationId: string): Promise<any> {
    await connectDB();
    return WhatsappInstance.findOne({ organizationId }).lean();
  }

  async getInstancesByOrg(organizationId: string): Promise<any[]> {
    await connectDB();
    return WhatsappInstance.find({ organizationId }).sort({ createdAt: -1 }).lean();
  }

  // ── Connect ──────────────────────────────────────────────

  async connect(organizationId: string): Promise<QRCodeData> {
    await connectDB();

    const instance = await WhatsappInstance.findOne({ organizationId });
    if (!instance) throw new Error("WhatsApp instance not found");

    // If already connected, return
    if (this.sockets.has(organizationId)) {
      const sock = this.sockets.get(organizationId)!;
      if (sock.user) {
        throw new Error("Already connected");
      }
    }

    // Update status
    instance.connectionStatus = "connecting";
    instance.updatedAt = new Date().toISOString();
    await instance.save();

    this.emitToOrg(organizationId, "whatsapp:connection_update", {
      status: "connecting",
      organizationId,
    } as ConnectionUpdate);

    // Create auth directory for this instance
    const authDir = `./whatsapp_auth/${organizationId}`;

    // Use Baileys auth state management
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console as any),
      },
      printQRInTerminal: false,
      browser: ["MyEnum Workspace", "Chrome", "1.0.0"],
      syncFullHistory: false,
      defaultQueryTimeoutMs: 30000,
    });

    this.sockets.set(organizationId, sock);

    // Handle QR code
    return new Promise<QRCodeData>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("QR code generation timeout"));
      }, 30000);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          clearTimeout(timeout);
          const qrDataUrl = await QRCode.toDataURL(qr);
          resolve({ qr: qrDataUrl, timestamp: new Date().toISOString() });
        }

        if (connection === "close") {
          const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = reason !== DisconnectReason.loggedOut;

          instance.connectionStatus = "disconnected";
          instance.lastDisconnectedAt = new Date().toISOString();
          instance.disconnectReason = shouldReconnect ? "reconnecting" : "logged_out";
          instance.updatedAt = new Date().toISOString();
          await instance.save();

          this.emitToOrg(organizationId, "whatsapp:connection_update", {
            status: "disconnected",
            reason: instance.disconnectReason,
            organizationId,
          } as ConnectionUpdate);

          if (shouldReconnect && instance.autoReconnect) {
            setTimeout(() => this.connect(organizationId), 3000);
          } else {
            this.sockets.delete(organizationId);
          }
        }

        if (connection === "open") {
          clearTimeout(timeout);
          instance.connectionStatus = "connected";
          instance.lastConnectedAt = new Date().toISOString();
          instance.phoneNumber = sock.user?.id?.split(":")[0];
          instance.pushName = sock.user?.name;
          instance.updatedAt = new Date().toISOString();
          await instance.save();

          this.emitToOrg(organizationId, "whatsapp:connection_update", {
            status: "connected",
            phoneNumber: instance.phoneNumber,
            pushName: instance.pushName,
            organizationId,
          } as ConnectionUpdate);
        }
      });

      // Save credentials on update
      sock.ev.on("creds.update", async (creds: any) => {
        instance.authState = {
          creds: state.creds,
          keys: Object.fromEntries(
            Object.entries(state.keys).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map((v: any) => v.toString("base64")) : value,
            ])
          ),
        };
        await instance.save();
        await saveCreds();
      });

      // Handle incoming messages
      sock.ev.on("messages.upsert", async (m) => {
        await this.handleIncomingMessages(organizationId, instance._id, m);
      });

      // Handle chat updates
      sock.ev.on("chats.upsert", async (chats) => {
        await this.handleChatUpsert(organizationId, instance._id, chats);
      });
    });
  }

  // ── Disconnect ───────────────────────────────────────────

  async disconnect(organizationId: string): Promise<void> {
    const sock = this.sockets.get(organizationId);
    if (sock) {
      try {
        await sock.logout();
      } catch {
        // ignore
      }
      this.sockets.delete(organizationId);
    }

    await connectDB();
    await WhatsappInstance.findOneAndUpdate(
      { organizationId },
      {
        connectionStatus: "disconnected",
        lastDisconnectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    this.emitToOrg(organizationId, "whatsapp:connection_update", {
      status: "disconnected",
      organizationId,
    } as ConnectionUpdate);
  }

  // ── Send Message ─────────────────────────────────────────

  async sendMessage(
    organizationId: string,
    to: string,
    text: string
  ): Promise<any> {
    const sock = this.sockets.get(organizationId);
    if (!sock || !sock.user) {
      throw new Error("WhatsApp not connected");
    }

    // Ensure JID format
    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;

    const result = await sock.sendMessage(jid, { text });

    // Store in DB
    if (result) {
      const instance = await WhatsappInstance.findOne({ organizationId }).lean() as any;
      await WhatsappMessage.create({
        _id: result.key.id,
        organizationId,
        instanceId: instance?._id,
        messageId: result.key.id!,
        jid,
        fromMe: true,
        senderJid: sock.user.id,
        senderName: sock.user.name || "",
        messageType: "text",
        messageText: text,
        status: "sent",
        sentAt: new Date().toISOString(),
      });
    }

    return result;
  }

  // ── Get Chats ────────────────────────────────────────────

  async getChats(organizationId: string): Promise<any[]> {
    await connectDB();
    return WhatsappChat.find({ organizationId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();
  }

  // ── Get Messages ─────────────────────────────────────────

  async getMessages(organizationId: string, jid: string, limit = 50): Promise<any[]> {
    await connectDB();
    return WhatsappMessage.find({ organizationId, jid })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // ── Delete Instance ──────────────────────────────────────

  async deleteInstance(organizationId: string): Promise<void> {
    await this.disconnect(organizationId);
    await connectDB();

    await Promise.all([
      WhatsappInstance.deleteOne({ organizationId }),
      WhatsappMessage.deleteMany({ organizationId }),
      WhatsappChat.deleteMany({ organizationId }),
    ]);
  }

  // ── Handle Incoming Messages ─────────────────────────────

  private async handleIncomingMessages(
    organizationId: string,
    instanceId: string,
    m: BaileysEventMap["messages.upsert"]
  ) {
    if (m.type !== "notify") return;

    for (const msg of m.messages) {
      if (!msg.key || !msg.key.remoteJid) continue;

      const messageType = this.getMessageType(msg);
      const messageText = this.extractMessageText(msg);

      // Store message
      await WhatsappMessage.findOneAndUpdate(
        { _id: msg.key.id },
        {
          _id: msg.key.id,
          organizationId,
          instanceId,
          messageId: msg.key.id!,
          jid: msg.key.remoteJid,
          fromMe: msg.key.fromMe || false,
          senderJid: msg.key.participant || msg.key.remoteJid,
          senderName: msg.pushName || "",
          messageType,
          messageText,
          status: "delivered",
          createdAt: new Date(msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()).toISOString(),
        },
        { upsert: true }
      );

      // Update chat
      await WhatsappChat.findOneAndUpdate(
        { instanceId, jid: msg.key.remoteJid },
        {
          $set: {
            lastMessageId: msg.key.id,
            lastMessageText: messageText?.substring(0, 200) || "",
            lastMessageAt: new Date().toISOString(),
            lastMessageSender: msg.pushName || "",
            lastMessageType: messageType,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            _id: crypto.randomUUID(),
            organizationId,
            instanceId,
            jid: msg.key.remoteJid,
            name: msg.pushName || msg.key.remoteJid.split("@")[0],
            isGroup: msg.key.remoteJid.endsWith("@g.us"),
            unreadCount: msg.key.fromMe ? 0 : 1,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      // Emit real-time
      this.emitToOrg(organizationId, "whatsapp:new_message", {
        message: msg,
        organizationId,
      });
    }
  }

  // ── Handle Chat Upsert ───────────────────────────────────

  private async handleChatUpsert(
    organizationId: string,
    instanceId: string,
    chats: any[]
  ) {
    for (const chat of chats) {
      await WhatsappChat.findOneAndUpdate(
        { instanceId, jid: chat.id },
        {
          $set: {
            name: chat.name || chat.id.split("@")[0],
            isGroup: chat.id.endsWith("@g.us"),
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            _id: crypto.randomUUID(),
            organizationId,
            instanceId,
            jid: chat.id,
            unreadCount: 0,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  private getMessageType(msg: WAMessage): string {
    if (!msg.message) return "unknown";
    if (msg.message.conversation) return "text";
    if (msg.message.extendedTextMessage) return "text";
    if (msg.message.imageMessage) return "image";
    if (msg.message.videoMessage) return "video";
    if (msg.message.audioMessage) return "audio";
    if (msg.message.documentMessage) return "document";
    if (msg.message.stickerMessage) return "sticker";
    if (msg.message.locationMessage) return "location";
    if (msg.message.contactMessage) return "contact";
    return "unknown";
  }

  private extractMessageText(msg: WAMessage): string | undefined {
    if (!msg.message) return undefined;
    return (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.documentMessage?.fileName ||
      `[${this.getMessageType(msg)}]`
    );
  }
}

// Singleton
export const whatsappService = new WhatsappService();
