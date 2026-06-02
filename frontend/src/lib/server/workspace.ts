import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";

function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  return cookies()
    .then((cookieStore) => {
      const token = cookieStore.get("access_token")?.value;
      return token ? { Cookie: `access_token=${token}` } : undefined;
    })
    .catch(() => undefined);
}

export const getHrSettings = cache(async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/workspace/hr-settings`, {
      headers,
      next: { revalidate: 120, tags: ["hr-settings"] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.hrSettings ?? null;
  } catch {
    return null;
  }
});
