/**
 * OpenWA Chat Service — chat operations: archive, pin, mute, labels, sendSeen, clear, mute/unmute.
 */

import crypto from "crypto";
import { connectDB } from "../config/connection.js";
import { WhatsappChat } from "../models/whatsapp.js";
import { openwaSessions } from "./openwa-session.js";

class OpenWAChatService {
  async syncChatsFromBaileys(organizationId: string, sessionId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const chats = (sock as any).fetchAllChats ? await (sock as any).fetchAllChats().catch(() => []) : [];
    for (const chat of chats) {
      await WhatsappChat.findOneAndUpdate(
        { organizationId, jid: chat.id },
        {
          $set: {
            name: chat.name || chat.id.split("@")[0],
            isGroup: chat.id.endsWith("@g.us"),
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            _id: crypto.randomUUID(),
            instanceId: sessionId,
            jid: chat.id,
            unreadCount: 0,
            isArchived: false,
            isMuted: false,
            isPinned: false,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
    return chats;
  }

  async getChats(organizationId: string, sessionId?: string, filter?: { archived?: boolean; pinned?: boolean }) {
    await connectDB();
    const q: any = { organizationId };
    if (sessionId) q.instanceId = sessionId;
    if (filter?.archived !== undefined) q.isArchived = filter.archived;
    if (filter?.pinned !== undefined) q.isPinned = filter.pinned;
    return WhatsappChat.find(q).sort({ lastMessageAt: -1 }).lean();
  }

  async getChat(organizationId: string, jid: string) {
    await connectDB();
    return WhatsappChat.findOne({ organizationId, jid }).lean();
  }

  async sendSeen(organizationId: string, sessionId: string, chatId: string, messageIds: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");

    const jid = chatId.includes("@") ? chatId : `${chatId}@s.whatsapp.net`;
    for (const id of messageIds) {
      await sock.readMessages([{ remoteJid: jid, id, participant: jid }]).catch(() => {});
    }

    await WhatsappChat.updateOne({ organizationId, jid }, { unreadCount: 0 }).catch(() => {});
    return { success: true };
  }

  async clearChat(organizationId: string, sessionId: string, chatId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = chatId.includes("@") ? chatId : `${chatId}@s.whatsapp.net`;
    await sock.chatModify({ clear: true }, jid).catch(() => {});
    await WhatsappChat.updateOne({ organizationId, jid }, { unreadCount: 0 }).catch(() => {});
    return { success: true };
  }

  async archiveChat(organizationId: string, jid: string, archive: boolean) {
    await connectDB();
    await WhatsappChat.updateOne(
      { organizationId, jid: jid.includes("@") ? jid : `${jid}@s.whatsapp.net` },
      { isArchived: archive, updatedAt: new Date().toISOString() }
    );
    return { success: true, archived: archive };
  }

  async pinChat(organizationId: string, jid: string, pin: boolean) {
    await connectDB();
    await WhatsappChat.updateOne(
      { organizationId, jid: jid.includes("@") ? jid : `${jid}@s.whatsapp.net` },
      { isPinned: pin, updatedAt: new Date().toISOString() }
    );
    return { success: true, pinned: pin };
  }

  async muteChat(organizationId: string, jid: string, muteUntilMs: number) {
    await connectDB();
    await WhatsappChat.updateOne(
      { organizationId, jid: jid.includes("@") ? jid : `${jid}@s.whatsapp.net` },
      { isMuted: true, muteUntil: new Date(muteUntilMs).toISOString(), updatedAt: new Date().toISOString() }
    );
    return { success: true };
  }

  async unmuteChat(organizationId: string, jid: string) {
    await connectDB();
    await WhatsappChat.updateOne(
      { organizationId, jid: jid.includes("@") ? jid : `${jid}@s.whatsapp.net` },
      { isMuted: false, muteUntil: null, updatedAt: new Date().toISOString() }
    );
    return { success: true };
  }
}

export const openwaChats = new OpenWAChatService();
