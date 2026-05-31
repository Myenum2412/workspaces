/**
 * Global search across all collections within an organization.
 */
import { connectDB } from "../config/connection.js";
import {
  UserProfile, Organization, Client, Task, Team, Branch,
  Contact, Group, Message, Campaign, MessageTemplate, Label,
  Session, WhatsappChat,
} from "../models/index.js";

interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  matchedField: string;
  score: number;
}

export async function globalSearch(
  organizationId: string,
  query: string,
  limit: number = 20,
  entityTypes?: string[]
): Promise<SearchResult[]> {
  await connectDB();
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const regex = { $regex: q, $options: "i" };
  const results: SearchResult[] = [];
  const searchable: Array<{ type: string; fn: () => Promise<SearchResult[]> }> = [
    {
      type: "contact",
      fn: async () => {
        const docs = await Contact.find({ organizationId, $or: [{ name: regex }, { phone: regex }, { pushName: regex }] }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "contact",
          entityId: d._id,
          title: d.name || d.pushName || d.phone || "Unknown",
          subtitle: d.phone,
          matchedField: d.name?.toLowerCase().includes(q.toLowerCase()) ? "name" : "phone",
          score: d.name?.toLowerCase() === q.toLowerCase() ? 10 : 5,
        }));
      },
    },
    {
      type: "chat",
      fn: async () => {
        const docs = await WhatsappChat.find({ organizationId, name: regex }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "chat",
          entityId: d._id,
          title: d.name || d.jid,
          subtitle: d.jid,
          matchedField: "name",
          score: 8,
        }));
      },
    },
    {
      type: "message",
      fn: async () => {
        const docs = await Message.find({ organizationId, body: regex }).sort({ createdAt: -1 }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "message",
          entityId: d._id,
          title: (d.body || "").substring(0, 100),
          subtitle: d.chatId,
          matchedField: "body",
          score: 3,
        }));
      },
    },
    {
      type: "campaign",
      fn: async () => {
        const docs = await Campaign.find({ organizationId, name: regex }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "campaign",
          entityId: d._id,
          title: d.name,
          subtitle: d.status,
          matchedField: "name",
          score: 9,
        }));
      },
    },
    {
      type: "template",
      fn: async () => {
        const docs = await MessageTemplate.find({ organizationId, $or: [{ name: regex }, { body: regex }] }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "template",
          entityId: d._id,
          title: d.name,
          subtitle: d.category,
          matchedField: "name",
          score: 7,
        }));
      },
    },
    {
      type: "user",
      fn: async () => {
        const docs = await UserProfile.find({ organizationId, $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "user",
          entityId: d._id,
          title: `${d.firstName} ${d.lastName}`.trim(),
          subtitle: d.email,
          matchedField: "name",
          score: 6,
        }));
      },
    },
    {
      type: "group",
      fn: async () => {
        const docs = await Group.find({ organizationId, name: regex }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "group",
          entityId: d._id,
          title: d.name,
          subtitle: `${d.participants?.length || 0} participants`,
          matchedField: "name",
          score: 8,
        }));
      },
    },
    {
      type: "session",
      fn: async () => {
        const docs = await Session.find({ organizationId, name: regex }).limit(limit).lean();
        return docs.map((d: any) => ({
          entityType: "session",
          entityId: d._id,
          title: d.name,
          subtitle: d.status,
          matchedField: "name",
          score: 7,
        }));
      },
    },
  ];

  const typesToSearch = entityTypes?.length ? searchable.filter((s) => entityTypes.includes(s.type)) : searchable;

  const searchResults = await Promise.allSettled(typesToSearch.map((s) => s.fn()));
  for (let i = 0; i < searchResults.length; i++) {
    const r = searchResults[i];
    if (r.status === "fulfilled") results.push(...r.value);
  }

  // Sort by score descending, then deduplicate by entityId
  const seen = new Set<string>();
  return results
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      const key = `${r.entityType}:${r.entityId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
