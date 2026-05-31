/**
 * Shared API client — single fetch wrapper for all backend communication.
 * Handles auth headers, token refresh, error parsing, and JSON serialization.
 *
 * Replaces: src/lib/appwrite/client.ts, src/lib/appwrite/auth.ts, src/lib/api.ts
 */

import { API_BASE_URL } from "./config";

// ── Token helpers ──────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict";
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// ── Error type ─────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code = "API_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ── Core fetch ─────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Session expired", 401, "TOKEN_EXPIRED");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      json?.error || json?.message || `Request failed: ${res.status}`,
      res.status,
      json?.code || "API_ERROR",
      json?.details
    );
  }

  return json as T;
}

// ── Convenience methods ────────────────────────────────────────

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

// ── Named API modules (backward-compatible with old @/lib/api imports) ─

export const authApi = {
  logout: () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict";
      }
    } catch { /* noop */ }
  },
};

export const profileApi = {
  get: () => api.get<{ success: boolean; profile: any }>("/api/profile"),
  update: (data: Record<string, unknown>) =>
    api.patch<{ success: boolean; profile: any }>("/api/profile", data),
  getHistory: (page = 1, limit = 20) =>
    api.get<{ success: boolean; entries: any[]; total: number; page: number; limit: number; pages: number }>(
      `/api/profile/history?page=${page}&limit=${limit}`,
    ),
  getActivity: (days?: number) =>
    api.get<{ success: boolean; activity: any[] }>(
      `/api/profile/activity${days ? `?days=${days}` : ""}`,
    ),
  export: () => api.get<any>("/api/profile/export"),
  adminListUsers: (params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.sortBy) q.set("sortBy", params.sortBy);
    if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
    return api.get<{ success: boolean; profiles: any[]; total: number; page: number; pages: number }>(`/api/profile/admin/users?${q}`);
  },
  adminSetStatus: (userId: string, status: string, reason?: string) =>
    api.patch<{ success: boolean; profile: any }>(`/api/profile/admin/users/${userId}/status`, { status, reason }),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, { method: "POST", headers, body: formData });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Upload failed"); }
    return res.json();
  },
};

export const contactsApi = {
  list: (params?: { search?: string; isBlocked?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.isBlocked !== undefined) q.set("isBlocked", String(params.isBlocked));
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api.get<{ total: number; page: number; limit: number; contacts: any[] }>(`/api/contacts?${q}`);
  },
  get: (id: string) => api.get<any>(`/api/contacts/${id}`),
  import: (contacts: any[]) => api.post<{ upserted: number; modified: number }>("/api/contacts/import", { contacts }),
  block: (id: string) => api.post<any>(`/api/contacts/${id}/block`, {}),
  unblock: (id: string) => api.delete<any>(`/api/contacts/${id}/block`),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/contacts/${id}`),
};

export const webhooksApi = {
  list: () => api.get<{ webhooks: any[] }>("/api/webhooks"),
  create: (data: { url: string; events?: string[]; secret?: string; headers?: Record<string, string>; retryCount?: number; sessionId?: string }) =>
    api.post<any>("/api/webhooks", data),
  update: (id: string, data: Partial<{ url: string; events: string[]; secret: string; headers: Record<string, string>; retryCount: number; active: boolean }>) =>
    api.put<any>(`/api/webhooks/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/webhooks/${id}`),
  test: (id: string) => api.post<{ success: boolean; statusCode?: number; error?: string }>(`/api/webhooks/${id}/test`, {}),
};

export const templatesApi = {
  list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api.get<{ total: number; page: number; limit: number; templates: any[] }>(`/api/templates?${q}`);
  },
  get: (id: string) => api.get<any>(`/api/templates/${id}`),
  create: (data: { name: string; category?: string; language?: string; body: string; variables?: string[]; header?: string; headerType?: string; footer?: string; buttons?: any[] }) =>
    api.post<any>("/api/templates", data),
  update: (id: string, data: any) => api.put<any>(`/api/templates/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/templates/${id}`),
};

export const campaignsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api.get<{ total: number; campaigns: any[] }>(`/api/campaigns?${q}`);
  },
  get: (id: string) => api.get<any>(`/api/campaigns/${id}`),
  create: (data: { name: string; description?: string; templateId?: string; audienceType?: string; audienceFilter?: any; scheduledAt?: string }) =>
    api.post<any>("/api/campaigns", data),
  update: (id: string, data: any) => api.put<any>(`/api/campaigns/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/campaigns/${id}`),
  execute: (id: string) => api.post<any>(`/api/campaigns/${id}/execute`, {}),
  pause: (id: string) => api.post<any>(`/api/campaigns/${id}/pause`, {}),
  resume: (id: string) => api.post<any>(`/api/campaigns/${id}/resume`, {}),
  stats: (id: string) => api.get<any>(`/api/campaigns/${id}/stats`),
};

export const automationApi = {
  list: () => api.get<{ rules: any[] }>("/api/openwa/automation"),
  get: (id: string) => api.get<any>(`/api/openwa/automation/${id}`),
  create: (data: { name: string; description?: string; triggerType: string; triggerConfig?: any; conditions?: any[]; actions?: any[] }) =>
    api.post<any>("/api/openwa/automation", data),
  update: (id: string, data: any) => api.put<any>(`/api/openwa/automation/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/openwa/automation/${id}`),
  toggle: (id: string) => api.post<any>(`/api/openwa/automation/${id}/toggle`, {}),
};

export const auditApi = {
  list: (params?: { action?: string; severity?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set("action", params.action);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return api.get<{ total: number; logs: any[] }>(`/api/audit?${q}`);
  },
  stats: () => api.get<any>("/api/audit/stats"),
};

export const labelsApi = {
  list: () => api.get<{ labels: any[] }>("/api/openwa/labels"),
  create: (data: { name: string; color?: string }) => api.post<any>("/api/openwa/labels", data),
  update: (id: string, data: { name?: string; color?: string }) => api.put<any>(`/api/openwa/labels/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/openwa/labels/${id}`),
};

export const workspaceApi = {
  getHrSettings: () => api.get<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings"),
  updateHrSettings: (data: any) => api.put<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings", data),
  getThemeSettings: () => api.get<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings"),
  updateThemeSettings: (data: any) => api.put<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings", data),
  getShifts: () => api.get<{ success: boolean; shifts: any[] }>("/api/workspace/shifts"),
  createShift: (data: any) => api.post<{ success: boolean; shift: any }>("/api/workspace/shifts", data),
  updateShift: (id: string, data: any) => api.put<{ success: boolean; shift: any }>(`/api/workspace/shifts/${id}`, data),
  deleteShift: (id: string) => api.delete<{ success: boolean }>(`/api/workspace/shifts/${id}`),
};
