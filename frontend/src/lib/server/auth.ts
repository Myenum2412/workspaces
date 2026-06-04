import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import type { AuthSession, UserProfile, Organization } from "@/types";

/**
 * Fetch current authenticated user session.
 * Runs in Server Component. Reads cookies from request headers.
 * Wrapped in React cache() — deduplicates within single render pass.
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) return null;

    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    const user = json.user;
    const org = json.organization as Organization | null;
    const membership = json.membership as Record<string, unknown> | null;

    return {
      user: {
        id: user?.$id ?? user?.id ?? "",
        email: user?.email ?? "",
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        name: user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
        avatarUrl: user?.avatarUrl,
        emailVerified: user?.emailVerified ?? false,
        role: membership?.role ?? user?.role,
        organizationId: membership?.organizationId ?? user?.organizationId,
      },
      profile: null,
      organization: org ? { ...org, id: org._id ?? org.id } : null,
      membership: membership as AuthSession["membership"],
    };
  } catch {
    return null;
  }
});

/**
 * Fetch user profile for current session.
 * Requires valid session. Returns null if not authenticated.
 */
export const getProfile = cache(async (): Promise<UserProfile | null> => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken) return null;

    const res = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.profile as UserProfile;
  } catch {
    return null;
  }
});

/**
 * Fetch organization by ID.
 */
export const getOrganization = cache(async (id: string): Promise<Organization | null> => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (!accessToken || !id) return null;

    const res = await fetch(`${API_BASE_URL}/api/organizations/${id}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      next: { revalidate: 60, tags: [`org-${id}`] },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return { ...json.organization, id: json.organization?._id ?? json.organization?.id };
  } catch {
    return null;
  }
});
