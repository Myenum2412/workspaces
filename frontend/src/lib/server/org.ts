import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import type { OrgMember, UserProfile } from "@/types";

async function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    return token ? { Cookie: `access_token=${token}` } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetch org members.
 */
export const getOrgMembers = cache(async (organizationId: string): Promise<OrgMember[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/members?organizationId=${organizationId}`, {
      headers,
      next: { revalidate: 60, tags: [`org-members-${organizationId}`] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.members ?? [];
  } catch {
    return [];
  }
});

/**
 * Fetch pending invitations for an org.
 */
export const getPendingInvites = cache(async (organizationId: string): Promise<number> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/invitations?organizationId=${organizationId}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return (json.invitations ?? []).filter((i: any) => i.status === "pending").length;
  } catch {
    return 0;
  }
});

/**
 * Fetch recent member profiles for dashboard display.
 */
export const getRecentMembers = cache(async (organizationId: string, limit = 5): Promise<UserProfile[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/staff?organizationId=${organizationId}&limit=${limit}&sort=createdAt:desc`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as UserProfile[];
  } catch {
    return [];
  }
});

/**
 * Dashboard stats for org admin.
 */
export const getOrgDashboardStats = cache(async (organizationId: string) => {
  try {
    const headers = await getAuthHeaders();

    const [membersRes, invitesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/members?organizationId=${organizationId}`, { headers }),
      fetch(`${API_BASE_URL}/api/invitations?organizationId=${organizationId}`, { headers }),
    ]);

    const membersJson = membersRes.ok ? await membersRes.json() : { members: [] };
    const invitesJson = invitesRes.ok ? await invitesRes.json() : { invitations: [] };

    const members: OrgMember[] = membersJson.members ?? [];
    const pendingInvites = (invitesJson.invitations ?? []).filter((i: any) => i.status === "pending").length;
    const activeCount = members.filter((m: any) => m.status === "active").length;

    return {
      totalMembers: members.length,
      activeMembers: activeCount,
      pendingInvites,
    };
  } catch {
    return { totalMembers: 0, activeMembers: 0, pendingInvites: 0 };
  }
});

/**
 * Fetch CEO/executive members (CEO, owner, admin roles).
 */
export const getExecutiveMembers = cache(async (organizationId: string) => {
  try {
    const headers = await getAuthHeaders();

    const [membersRes, profilesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/members?organizationId=${organizationId}`, { headers }),
      fetch(`${API_BASE_URL}/api/staff?organizationId=${organizationId}`, { headers, next: { revalidate: 60 } }),
    ]);

    const membersJson = membersRes.ok ? await membersRes.json() : { members: [] };
    const profilesJson = profilesRes.ok ? await profilesRes.json() : { data: [] };

    const members: OrgMember[] = membersJson.members ?? [];
    const profiles: UserProfile[] = profilesJson.data ?? [];

    const CEO_ROLES = ["ceo", "owner", "admin"];
    return members
      .filter((m: OrgMember) => CEO_ROLES.includes((m.role ?? "").toLowerCase()))
      .map((member: OrgMember) => {
        const profile = profiles.find((p: UserProfile) => p.userId === member.userId);
        return profile ? { profile, member } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
});
