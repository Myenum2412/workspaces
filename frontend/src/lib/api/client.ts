import { API_BASE_URL } from "./config";
import type {
  AuthSession,
  UserProfile,
  Task,
  FileRecord,
  PaginatedResult,
  ApiResponseMeta,
} from "@/types/shared";

// ── Token Helpers ──────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── API Error ──────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ── Core Fetch ─────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  if (options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      if (!path.includes("/api/auth/refresh")) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshRes.ok) {
            const retryRes = await fetch(`${API_BASE_URL}${path}`, {
              ...options,
              headers,
              credentials: "include",
            });
            if (retryRes.ok) return (await retryRes.json()) as T;
            const retryJson = await retryRes.json().catch(() => null);
            throw new ApiError(
              retryJson?.error?.message || retryJson?.message || `Request failed: ${retryRes.status}`,
              retryRes.status,
              retryJson?.error?.code || retryJson?.code || "API_ERROR",
              retryJson?.error?.details || retryJson?.details,
            );
          }
        } catch (refreshErr) {
          if (refreshErr instanceof ApiError) throw refreshErr;
        }
      }
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/signup") ||
        currentPath.startsWith("/forgot-password") ||
        currentPath.startsWith("/reset-password");
      if (!isAuthPage) {
        window.location.href = "/login?reason=session_expired";
      }
    }

    throw new ApiError(
      json?.error?.message || json?.message || `Request failed: ${res.status}`,
      res.status,
      json?.error?.code || json?.code || "API_ERROR",
      json?.error?.details || json?.details,
    );
  }

  return json as T;
}

// ── HTTP Method Helpers ────────────────────────────────────────

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

// ── Auth API ───────────────────────────────────────────────────

export const authApi = {
  logout: async (): Promise<void> => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* ignore */
    }
  },

  refresh: async (): Promise<unknown> => {
    return apiFetch("/api/auth/refresh", { method: "POST", body: "{}" });
  },

  getMe: () =>
    apiFetch<{
      success: boolean;
      user: AuthSession["user"];
      organization: AuthSession["organization"];
      membership: AuthSession["membership"];
    }>("/api/auth/me"),
};

// ── Profile API ────────────────────────────────────────────────

export const profileApi = {
  get: () =>
    apiFetch<{ success: boolean; profile: UserProfile }>("/api/profile"),

  update: (data: Partial<UserProfile>) =>
    apiFetch<{ success: boolean; profile: UserProfile }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getHistory: (page = 1, limit = 20) =>
    apiFetch<{
      success: boolean;
      entries: unknown[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>(`/api/profile/history?page=${page}&limit=${limit}`),

  getActivity = (days?: number) =>
    apiFetch<{ success: boolean; activity: unknown[] }>(
      `/api/profile/activity${days ? `?days=${days}` : ""}`,
    ),

  export: () => apiFetch<Record<string, unknown>>("/api/profile/export"),

  adminListUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.sortBy) q.set("sortBy", params.sortBy);
    if (params?.sortOrder) q.set("sortOrder", params.sortOrder);
    return apiFetch<{
      success: boolean;
      profiles: unknown[];
      total: number;
      page: number;
      pages: number;
    }>(`/api/profile/admin/users?${q}`);
  },

  adminSetStatus: (userId: string, status: string, reason?: string) =>
    apiFetch<{ success: boolean; profile: UserProfile }>(
      `/api/profile/admin/users/${userId}/status`,
      { method: "PATCH", body: JSON.stringify({ status, reason }) },
    ),

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

// ── Workspace API ──────────────────────────────────────────────

export const workspaceApi = {
  getHrSettings: () =>
    apiFetch<{ success: boolean; hrSettings: Record<string, unknown> }>(
      "/api/workspace/hr-settings",
    ),

  updateHrSettings: (data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; hrSettings: Record<string, unknown> }>(
      "/api/workspace/hr-settings",
      { method: "PUT", body: JSON.stringify(data) },
    ),

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

  getShifts: () =>
    apiFetch<{ success: boolean; shifts: unknown[] }>("/api/workspace/shifts"),

  createShift: (data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; shift: Record<string, unknown> }>(
      "/api/workspace/shifts",
      { method: "POST", body: JSON.stringify(data) },
    ),

  updateShift: (id: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; shift: Record<string, unknown> }>(
      `/api/workspace/shifts/${id}`,
      { method: "PUT", body: JSON.stringify(data) },
    ),

  deleteShift: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/workspace/shifts/${id}`, { method: "DELETE" }),
};

// ── Upload API ─────────────────────────────────────────────────

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfToken();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
    const res = await fetch(`${API_BASE_URL}/api/upload/file`, {
      method: "POST",
      credentials: "include",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Upload failed");
    }
    return res.json() as Promise<{
      success: boolean;
      url: string;
      key: string;
      filename: string;
      mimetype: string;
      size: number;
    }>;
  },
};

// ── Files API ──────────────────────────────────────────────────

export const filesApi = {
  list: (params?: { folder?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.folder) q.set("folder", params.folder);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return apiFetch<PaginatedResult<FileRecord>>(`/api/workspace/files?${q}`);
  },

  listFolders: () =>
    apiFetch<{ success: boolean; folders: string[] }>("/api/workspace/files/folders"),

  createRecord: (data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    key: string;
    folder: string;
  }) =>
    apiFetch<{ success: boolean; file: FileRecord }>("/api/workspace/files/record", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/workspace/files/${id}`, { method: "DELETE" }),

  uploadAndRecord: async (file: File) => {
    const uploadResult = await uploadApi.uploadFile(file);
    const key = uploadResult.key;
    const folder = key.split("/")[0] || "files";
    const recordResult = await filesApi.createRecord({
      filename: uploadResult.filename,
      originalName: file.name,
      mimetype: uploadResult.mimetype,
      size: uploadResult.size,
      url: uploadResult.url,
      key,
      folder,
    });
    return recordResult;
  },
};
