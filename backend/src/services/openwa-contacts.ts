import { connectDB } from "../config/connection.js";
import { Contact } from "../models/openwa.js";
import { openwaSessions } from "./openwa-session.js";
import crypto from "crypto";

class OpenWAContactService {
  async getContacts(organizationId: string, sessionId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const contacts = await (sock as any).store?.contacts || [];
    // Also return from DB
    const dbContacts = await Contact.find({ organizationId, sessionId }).lean();
    return dbContacts.length > 0 ? dbContacts : contacts;
  }

  async getContactById(organizationId: string, sessionId: string, contactId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = contactId.includes("@") ? contactId : `${contactId}@s.whatsapp.net`;
    const contact = await (sock as any).store?.contacts?.[jid];
    if (!contact) throw new Error("Contact not found");
    return contact;
  }

  async checkNumber(organizationId: string, sessionId: string, number: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = `${number}@s.whatsapp.net`;
    const result = await sock.onWhatsApp(jid);
    const exists = Array.isArray(result) ? result[0]?.exists : false;
    return { number, exists, whatsappId: exists ? jid : null };
  }

  async getProfilePicture(organizationId: string, sessionId: string, contactId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = contactId.includes("@") ? contactId : `${contactId}@s.whatsapp.net`;
    const url = await sock.profilePictureUrl(jid, "image").catch(() => null);
    return { url };
  }

  async blockContact(organizationId: string, sessionId: string, contactId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = contactId.includes("@") ? contactId : `${contactId}@s.whatsapp.net`;
    await sock.updateBlockStatus(jid, "block");
    return { success: true };
  }

  async unblockContact(organizationId: string, sessionId: string, contactId: string) {
    await connectDB();
    const sock = openwaSessions.getSocket(sessionId);
    if (!sock?.user) throw new Error("Session not active");
    const jid = contactId.includes("@") ? contactId : `${contactId}@s.whatsapp.net`;
    await sock.updateBlockStatus(jid, "unblock");
    return { success: true };
  }

  async importContacts(organizationId: string, sessionId: string, contacts: Array<{ name: string; phone: string }>) {
    await connectDB();
    const docs = contacts.map(c => ({
      _id: crypto.randomUUID(), organizationId, sessionId,
      waContactId: `${c.phone}@s.whatsapp.net`,
      name: c.name, phone: c.phone, isMyContact: true, isBlocked: false,
    }));
    await Contact.insertMany(docs, { ordered: false }).catch(() => {});
    return { imported: docs.length };
  }

  async exportContacts(organizationId: string, sessionId: string) {
    await connectDB();
    return Contact.find({ organizationId, sessionId }).lean();
  }
}

export const openwaContacts = new OpenWAContactService();
