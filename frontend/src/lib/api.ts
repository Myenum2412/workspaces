import { API_BASE_URL } from "@/lib/api/config";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Request failed");
  }
  return res.json();
}

// ── Auth (existing) ─────────────────────────────────────────
export const authApi = {
  async logout() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict";
      }
    } catch { /* noop */ }
  },
};

// ── Contacts ────────────────────────────────────────────────
export const contactsApi = {
  list: (params?: { search?: string; isBlocked?: boolean; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.isBlocked !== undefined) q.set("isBlocked", String(params.isBlocked));
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ total: number; page: number; limit: number; contacts: any[] }>(`/api/contacts?${q}`);
  },
  get: (id: string) => apiFetch<any>(`/api/contacts/${id}`),
  import: (contacts: any[]) => apiFetch<{ upserted: number; modified: number }>("/api/contacts/import", { method: "POST", body: JSON.stringify({ contacts }) }),
  block: (id: string) => apiFetch<any>(`/api/contacts/${id}/block`, { method: "POST" }),
  unblock: (id: string) => apiFetch<any>(`/api/contacts/${id}/block`, { method: "DELETE" }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/contacts/${id}`, { method: "DELETE" }),
};

// ── Webhooks ────────────────────────────────────────────────
export const webhooksApi = {
  list: () => apiFetch<{ webhooks: any[] }>("/api/webhooks"),
  create: (data: { url: string; events?: string[]; secret?: string; headers?: Record<string, string>; retryCount?: number; sessionId?: string }) =>
    apiFetch<any>("/api/webhooks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ url: string; events: string[]; secret: string; headers: Record<string, string>; retryCount: number; active: boolean }>) =>
    apiFetch<any>(`/api/webhooks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/webhooks/${id}`, { method: "DELETE" }),
  test: (id: string) => apiFetch<{ success: boolean; statusCode?: number; error?: string }>(`/api/webhooks/${id}/test`, { method: "POST" }),
};

// ── Templates ───────────────────────────────────────────────
export const templatesApi = {
  list: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.search) q.set("search", params.search);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ total: number; page: number; limit: number; templates: any[] }>(`/api/templates?${q}`);
  },
  get: (id: string) => apiFetch<any>(`/api/templates/${id}`),
  create: (data: { name: string; category?: string; language?: string; body: string; variables?: string[]; header?: string; headerType?: string; footer?: string; buttons?: any[] }) =>
    apiFetch<any>("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/templates/${id}`, { method: "DELETE" }),
};

// ── Campaigns ───────────────────────────────────────────────
export const campaignsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ total: number; campaigns: any[] }>(`/api/campaigns?${q}`);
  },
  get: (id: string) => apiFetch<any>(`/api/campaigns/${id}`),
  create: (data: { name: string; description?: string; templateId?: string; audienceType?: string; audienceFilter?: any; scheduledAt?: string }) =>
    apiFetch<any>("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/api/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/campaigns/${id}`, { method: "DELETE" }),
  execute: (id: string) => apiFetch<any>(`/api/campaigns/${id}/execute`, { method: "POST" }),
  pause: (id: string) => apiFetch<any>(`/api/campaigns/${id}/pause`, { method: "POST" }),
  resume: (id: string) => apiFetch<any>(`/api/campaigns/${id}/resume`, { method: "POST" }),
  stats: (id: string) => apiFetch<any>(`/api/campaigns/${id}/stats`),
};

// ── Bulk Messaging ──────────────────────────────────────────
export const bulkApi = {
  createJob: (data: { sessionId: string; messages: any[]; options?: any }) =>
    apiFetch<any>("/api/bulk", { method: "POST", body: JSON.stringify(data) }),
  getJobs: () => apiFetch<{ jobs: any[] }>("/api/bulk"),
  getJob: (id: string) => apiFetch<any>(`/api/bulk/${id}`),
  cancelJob: (id: string) => apiFetch<any>(`/api/bulk/${id}/cancel`, { method: "POST" }),
};

// ── Automation ──────────────────────────────────────────────
export const automationApi = {
  list: () => apiFetch<{ rules: any[] }>("/api/automation"),
  get: (id: string) => apiFetch<any>(`/api/automation/${id}`),
  create: (data: { name: string; description?: string; triggerType: string; triggerConfig?: any; conditions?: any[]; actions?: any[] }) =>
    apiFetch<any>("/api/automation", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/api/automation/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/automation/${id}`, { method: "DELETE" }),
  toggle: (id: string) => apiFetch<any>(`/api/automation/${id}/toggle`, { method: "POST" }),
};

// ── Reports ─────────────────────────────────────────────────
export const reportsApi = {
  messageStats: (params?: { startDate?: string; endDate?: string; sessionId?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    if (params?.sessionId) q.set("sessionId", params.sessionId);
    return apiFetch<any>(`/api/reports/messages?${q}`);
  },
  deliveryReport: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    return apiFetch<any>(`/api/reports/delivery?${q}`);
  },
  contactGrowth: (params?: { startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    return apiFetch<any>(`/api/reports/contacts?${q}`);
  },
  campaignPerformance: () => apiFetch<any>("/api/reports/campaigns"),
};

// ── Audit Logs ──────────────────────────────────────────────
export const auditApi = {
  list: (params?: { action?: string; severity?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set("action", params.action);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<{ total: number; logs: any[] }>(`/api/audit?${q}`);
  },
  stats: () => apiFetch<any>("/api/audit/stats"),
};

// ── Labels ──────────────────────────────────────────────────
export const labelsApi = {
  list: () => apiFetch<{ labels: any[] }>("/api/labels"),
  create: (data: { name: string; color?: string }) => apiFetch<any>("/api/labels", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; color?: string }) => apiFetch<any>(`/api/labels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<{ success: boolean }>(`/api/labels/${id}`, { method: "DELETE" }),
};

// ── Profile ─────────────────────────────────────────────────
export const profileApi = {
  get: () => apiFetch<{ success: boolean; profile: any }>("/api/profile"),
  update: (data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; profile: any }>("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
  getHistory: (page = 1, limit = 20) =>
    apiFetch<{ success: boolean; entries: any[]; total: number; page: number; limit: number; pages: number }>(
      `/api/profile/history?page=${page}&limit=${limit}`,
    ),
  getActivity: (days?: number) =>
    apiFetch<{ success: boolean; activity: any[] }>(
      `/api/profile/activity${days ? `?days=${days}` : ""}`,
    ),
  export: () => apiFetch<any>("/api/profile/export"),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/profile/avatar`, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    return res.json();
  },

  // ── Admin ────────────────────────────────────────────────
  adminListUsers: (params?: { page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.sortBy) q.set("sortBy", params.sortBy);
    if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
    return apiFetch<{ success: boolean; profiles: any[]; total: number; page: number; pages: number }>(
      `/api/profile/admin/users?${q}`,
    );
  },
  adminUpdateUser: (userId: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; profile: any }>(`/api/profile/${userId}`, { method: "PATCH", body: JSON.stringify(data) }),
  adminSetStatus: (userId: string, status: string, reason?: string) =>
    apiFetch<{ success: boolean; profile: any }>(`/api/profile/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
};

// ── Workspace ───────────────────────────────────────────────
export const workspaceApi = {
  getHrSettings: () => apiFetch<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings"),
  updateHrSettings: (data: any) =>
    apiFetch<{ success: boolean; hrSettings: any }>("/api/workspace/hr-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getThemeSettings: () => apiFetch<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings"),
  updateThemeSettings: (data: any) =>
    apiFetch<{ success: boolean; themeSettings: any }>("/api/workspace/theme-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getShifts: () => apiFetch<{ success: boolean; shifts: any[] }>("/api/workspace/shifts"),
  createShift: (data: any) =>
    apiFetch<{ success: boolean; shift: any }>("/api/workspace/shifts", { method: "POST", body: JSON.stringify(data) }),
  updateShift: (id: string, data: any) =>
    apiFetch<{ success: boolean; shift: any }>(`/api/workspace/shifts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteShift: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/workspace/shifts/${id}`, { method: "DELETE" }),
};
