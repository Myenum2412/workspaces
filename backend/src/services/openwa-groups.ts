import { connectDB } from "../config/connection.js";
import { Group } from "../models/openwa.js";
import { openwaSessions } from "./openwa-session.js";
import crypto from "crypto";

class OpenWAGroupService {
  async getGroups(organizationId: string, sessionId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const groups = await sock.groupFetchAllParticipating().catch(() => ({}));
    return Object.values(groups || {}).map((g: any) => ({
      id: g.id, name: g.subject, participantsCount: g.participants?.length || 0,
      isAdmin: g.participants?.some((p: any) => p.id === sock.user?.id && (p.admin === "admin" || p.admin === "superadmin")),
    }));
  }

  async getGroupInfo(organizationId: string, sessionId: string, groupId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const info = await sock.groupMetadata(id).catch(() => null);
    if (!info) throw new Error("Group not found");
    return {
      id: info.id, name: info.subject, description: info.desc,
      owner: info.owner, createdAt: info.creation,
      participants: (info.participants || []).map((p: any) => ({
        id: p.id, number: p.id.split("@")[0], isAdmin: p.admin === "admin", isSuperAdmin: p.admin === "superadmin",
      })),
    };
  }

  async createGroup(organizationId: string, sessionId: string, name: string, participants: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jids = participants.map(p => p.includes("@") ? p : `${p}@s.whatsapp.net`);
    const result = await sock.groupCreate(name, jids);
    return { id: result.id, name: result.subject };
  }

  async addParticipants(organizationId: string, sessionId: string, groupId: string, participants: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const jids = participants.map(p => p.includes("@") ? p : `${p}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(id, jids, "add");
    return { success: true };
  }

  async removeParticipants(organizationId: string, sessionId: string, groupId: string, participants: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const jids = participants.map(p => p.includes("@") ? p : `${p}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(id, jids, "remove");
    return { success: true };
  }

  async promoteParticipants(organizationId: string, sessionId: string, groupId: string, participants: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const jids = participants.map(p => p.includes("@") ? p : `${p}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(id, jids, "promote");
    return { success: true };
  }

  async demoteParticipants(organizationId: string, sessionId: string, groupId: string, participants: string[]) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const jids = participants.map(p => p.includes("@") ? p : `${p}@s.whatsapp.net`);
    await sock.groupParticipantsUpdate(id, jids, "demote");
    return { success: true };
  }

  async setGroupSubject(organizationId: string, sessionId: string, groupId: string, subject: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    await sock.groupUpdateSubject(id, subject);
    return { success: true };
  }

  async setGroupDescription(organizationId: string, sessionId: string, groupId: string, description: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    await sock.groupUpdateDescription(id, description);
    return { success: true };
  }

  async leaveGroup(organizationId: string, sessionId: string, groupId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    await sock.groupLeave(id);
    return { success: true };
  }

  async getGroupInviteCode(organizationId: string, sessionId: string, groupId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const code = await sock.groupInviteCode(id);
    return { inviteCode: code, inviteLink: `https://chat.whatsapp.com/${code}` };
  }

  async revokeGroupInviteCode(organizationId: string, sessionId: string, groupId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const id = groupId.includes("@") ? groupId : `${groupId}@g.us`;
    const newCode = await sock.groupRevokeInvite(id);
    return { inviteCode: newCode, inviteLink: `https://chat.whatsapp.com/${newCode}` };
  }
}

export const openwaGroups = new OpenWAGroupService();
