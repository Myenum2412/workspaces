import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import type { Team } from "@/types";

function mapTeam(doc: any): Team {
  return {
    id: doc._id ?? doc.id ?? "",
    name: doc.name ?? "",
    headUserId: doc.headUserId ?? doc.head ?? "",
    memberIds: doc.memberIds ?? doc.members ?? [],
    status: doc.status ?? "Active",
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    deletedAt: doc.deletedAt,
  };
}

function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  return cookies()
    .then((cookieStore) => {
      const token = cookieStore.get("access_token")?.value;
      return token ? { Cookie: `access_token=${token}` } : undefined;
    })
    .catch(() => undefined);
}

export const getAllTeams = cache(async (): Promise<Team[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/teams`, {
      headers,
      next: { revalidate: 60, tags: ["teams"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.teams ?? []).map(mapTeam);
  } catch {
    return [];
  }
});
