/**
 * Global search across all collections within an organization.
 */
import { connectDB } from "../config/connection.js";
import {
  UserProfile, Organization, Client, Task, Team, Branch,
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
