/**
 * Shared API client — cookie-based auth.
 * Relies on httpOnly cookies set by the backend (no localStorage tokens).
 * Sends credentials: 'include' for cross-origin cookie forwarding.
 * Falls back to Authorization header for Socket.IO connections (can't send cookies via WS).
 */

import { API_BASE_URL } from "./config";

// ── Token helpers (kept for Socket.IO auth only) ───────────────

export function getToken(): string | null {
  // Read from cookie for Socket.IO fallback
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
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

// ── CSRF Token helper ──────────────────────────────────────────

function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
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

// ── Core fetch — cookie-based, no manual token attachment ──────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // For FormData (file uploads), let the browser set Content-Type with boundary
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  // Add CSRF token for state-changing requests
  if (options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // Send httpOnly cookies
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // If 401, session expired — redirect to login
    if (res.status === 401 && typeof window !== "undefined") {
      // Try refresh first
      if (!path.includes("/api/auth/refresh")) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshRes.ok) {
            // Retry original request with new cookies
            const retryRes = await fetch(`${API_BASE_URL}${path}`, {
              ...options,
              headers,
              credentials: "include",
            });
            if (retryRes.ok) return (await retryRes.json()) as T;
            // Retry failed with non-2xx — fall through to throw below
            const retryJson = await retryRes.json().catch(() => null);
            const errorMsg = typeof retryJson?.error === "string" ? retryJson.error : retryJson?.error?.message;
            throw new ApiError(
              errorMsg || retryJson?.message || `Request failed: ${retryRes.status}`,
              retryRes.status,
              retryJson?.error?.code || retryJson?.code || "API_ERROR",
              retryJson?.error?.details || retryJson?.details
            );
          }
          // Refresh returned non-2xx — fall through to redirect (don't catch)
        } catch (refreshErr) {
          // Only redirect if refresh itself failed (network error, etc.)
          // Don't redirect on retry request failures — throw those instead
          if (refreshErr instanceof ApiError) throw refreshErr;
          // Refresh network failure — fall through to redirect
        }
      }
      // All refresh attempts failed — redirect to login, but not if already on an auth page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/login") && !currentPath.startsWith("/signup") && !currentPath.startsWith("/forgot-password") && !currentPath.startsWith("/reset-password")) {
        window.location.href = "/login?reason=session_expired";
      }
    }

    const errorMsg = typeof json?.error === "string" ? json.error : json?.error?.message;
    throw new ApiError(
      errorMsg || json?.message || `Request failed: ${res.status}`,
      res.status,
      json?.error?.code || json?.code || "API_ERROR",
      json?.error?.details || json?.details
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

// ── Auth API ──────────────────────────────────────────────────

export const authApi = {
  logout: async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
    } catch { /* ignore */ }
  },
  refresh: async () => {
    return apiFetch("/api/auth/refresh", { method: "POST", body: "{}" });
  },
  getMe: () => api.get<{
    success: boolean;
    user: any;
    organization: any;
    membership: any;
  }>("/api/auth/me"),
};

// ── Profile API ──────────────────────────────────────────────

export const profileApi = {
  get: () => api.get<{ success: boolean; profile: any }>("/api/profile"),
  update: (data: Record<string, unknown>) =>
    api.patch<{ success: boolean; profile: any }>("/api/profile", data),
  getHistory: (page = 1, limit = 20) =>
    api.get<{ success: boolean; entries: any[]; total: number; page: number; limit: number; pages: number }>(
      `/api/profile/history?page=${page}&limit=${limit}`
    ),
  getActivity: (days?: number) =>
    api.get<{ success: boolean; activity: any[] }>(
      `/api/profile/activity${days ? `?days=${days}` : ""}`
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
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    return res.json() as Promise<{ success: boolean; url: string; avatarUrl: string }>;
  },
};

// ── Contacts API ──────────────────────────────────────────────

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

// ── Webhooks API ──────────────────────────────────────────────

export const webhooksApi = {
  list: () => api.get<{ webhooks: any[] }>("/api/webhooks"),
  create: (data: { url: string; events?: string[]; secret?: string; headers?: Record<string, string>; retryCount?: number; sessionId?: string }) =>
    api.post<any>("/api/webhooks", data),
  update: (id: string, data: Partial<{ url: string; events: string[]; secret: string; headers: Record<string, string>; retryCount: number; active: boolean }>) =>
    api.put<any>(`/api/webhooks/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/api/webhooks/${id}`),
  test: (id: string) => api.post<{ success: boolean; statusCode?: number; error?: string }>(`/api/webhooks/${id}/test`, {}),
};

// ── Templates API ─────────────────────────────────────────────

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

// ── Campaigns API ─────────────────────────────────────────────

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

// ── Audit API ─────────────────────────────────────────────────

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

// ── Workspace API ─────────────────────────────────────────────

export const workspaceApi = {
  getHrSettings: () => api.get<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings"),
  updateHrSettings: (data: any) => api.put<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings", data),
  getThemeSettings: () => api.get<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings"),
  updateThemeSettings: (data: any) =>
    api.put<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings", data),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    return res.json() as Promise<{ success: boolean; url: string }>;
  },
  getShifts: () => api.get<{ success: boolean; shifts: any[] }>("/api/workspace/shifts"),
  createShift: (data: any) => api.post<{ success: boolean; shift: any }>("/api/workspace/shifts", data),
  updateShift: (id: string, data: any) => api.put<{ success: boolean; shift: any }>(`/api/workspace/shifts/${id}`, data),
  deleteShift: (id: string) => api.delete<{ success: boolean }>(`/api/workspace/shifts/${id}`),
};

// ── Branding API ────────────────────────────────────────────

export interface BrandingColors {
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
}

export interface BrandingConfig {
  organizationId: string;
  colors: BrandingColors;
  darkModeColors: Partial<BrandingColors>;
  typography: { fontFamily: string; headingFont: string; monoFont: string; baseFontSize: number };
  logo: { url: string; width: number; height: number; darkModeUrl: string };
  favicon: string;
  mode: "light" | "dark" | "system";
  presetName: string;
  version: number;
  updatedBy: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface BrandingHistoryEntry {
  _id: string;
  organizationId: string;
  version: number;
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
  snapshot: Record<string, any>;
  updatedBy: string;
  updatedByName: string;
  rollbackFrom: number | null;
  createdAt: string;
}

export const brandingApi = {
  get: () => api.get<{ success: boolean; branding: BrandingConfig; isDefault: boolean }>("/api/branding"),

  update: (data: Partial<BrandingConfig>) =>
    api.put<{ success: boolean; branding: BrandingConfig; version: number }>("/api/branding", data),

  getHistory: (page = 1, limit = 20) =>
    api.get<{
      success: boolean;
      history: BrandingHistoryEntry[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/api/branding/history?page=${page}&limit=${limit}`),

  rollback: (version: number) =>
    api.post<{ success: boolean; branding: BrandingConfig; version: number }>("/api/branding/rollback", { version }),

  validate: (colors: Record<string, string>) =>
    api.post<{
      success: boolean;
      validation: Record<string, { valid: boolean; contrastAA: boolean; contrastAAA: boolean; ratio: number; message: string }>;
    }>("/api/branding/validate", { colors }),

  reset: () =>
    api.post<{ success: boolean; branding: BrandingConfig; version: number }>("/api/branding/reset", {}),

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    return res.json() as Promise<{ success: boolean; url: string }>;
  },
};
