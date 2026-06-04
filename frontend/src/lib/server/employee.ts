import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import { mapUserProfile } from "@/lib/types/mappers";
import type { UserProfile, EmployeeStats } from "@/types";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  return token ? { Cookie: `access_token=${token}` } : {};
}

export const getEmployeeStats = cache(async (): Promise<EmployeeStats> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/members/stats`, {
      headers,
      next: { revalidate: 60, tags: ["employee-stats"] },
    });
    if (!res.ok) return { totalEmployees: 0, activeNow: 0, onLeave: 0, assignedTasks: 0 };
    const json = await res.json();
    const d = json.data ?? json;
    return {
      totalEmployees: d.totalEmployees ?? d.total ?? 0,
      activeNow: d.activeNow ?? d.active ?? 0,
      onLeave: d.onLeave ?? d.leave ?? 0,
      assignedTasks: d.assignedTasks ?? d.tasks ?? 0,
    };
  } catch {
    return { totalEmployees: 0, activeNow: 0, onLeave: 0, assignedTasks: 0 };
  }
});

export const getAllEmployees = cache(async (): Promise<UserProfile[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/members`, {
      headers,
      next: { revalidate: 60, tags: ["employees"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const docs = json.data ?? json.employees ?? [];
    return Array.isArray(docs) ? docs.map(mapUserProfile).filter((e): e is UserProfile => e !== null) : [];
  } catch {
    return [];
  }
});

export const getEmployeeById = cache(async (id: string): Promise<UserProfile | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      headers,
      next: { revalidate: 60, tags: [`employee-${id}`] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return mapUserProfile(json.data ?? json.employee);
  } catch {
    return null;
  }
});
