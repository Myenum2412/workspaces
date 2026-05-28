import { API_BASE_URL } from "../api/config";

const BACKEND_URL = API_BASE_URL;

export const DB_ID = process.env.MONGODB_DB as string;

export const ID = {
  unique: () => crypto.randomUUID(),
};

export const Query = {
  equal: (field: string, value: string) => ({ field, operator: "equal" as const, value }),
  limit: (n: number) => ({ operator: "limit" as const, value: n }),
  orderDesc: (field: string) => ({ field, operator: "orderDesc" as const }),
  orderAsc: (field: string) => ({ field, operator: "orderAsc" as const }),
};

type QueryCondition = { field?: string; operator: string; value?: any };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (token && isTokenExpired(token)) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || "Request failed");
  return json;
}

async function dbFetch(method: string, collectionId: string, opts?: {
  documentId?: string;
  queries?: QueryCondition[];
  data?: Record<string, unknown>;
}) {
  return apiFetch("/api/db", {
    method: "POST",
    body: JSON.stringify({
      method,
      collectionId,
      documentId: opts?.documentId,
      queries: opts?.queries,
      data: opts?.data,
    }),
  });
}

export const databases = {
  listDocuments(databaseId: string, collectionId: string, queries?: QueryCondition[]) {
    return dbFetch("listDocuments", collectionId, { queries });
  },

  createDocument(databaseId: string, collectionId: string, documentId: string, data: Record<string, unknown>) {
    return dbFetch("createDocument", collectionId, { documentId, data });
  },

  getDocument(databaseId: string, collectionId: string, documentId: string) {
    return dbFetch("getDocument", collectionId, { documentId });
  },

  updateDocument(databaseId: string, collectionId: string, documentId: string, data: Record<string, unknown>) {
    return dbFetch("updateDocument", collectionId, { documentId, data });
  },

  deleteDocument(databaseId: string, collectionId: string, documentId: string) {
    return dbFetch("deleteDocument", collectionId, { documentId });
  },
};

export const account = {
  async get() {
    const result = await apiFetch("/api/auth/me");
    if (!result.user) throw new Error("Not authenticated");
    return {
      $id: result.user.$id,
      email: result.user.email,
      name: result.user.name || `${result.user.firstName ?? ""} ${result.user.lastName ?? ""}`.trim(),
      emailVerification: true,
      phone: "",
      phoneVerification: false,
      status: true,
      prefs: {},
      registration: "",
      labels: [],
      accessedAt: new Date().toISOString(),
    };
  },

  async create(id: string, email: string, password: string, name: string) {
    const result = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, companyName: name, email, password, category: "Other", companyRange: "1-10" }),
    });
    if (result.token) setToken(result.token);
    return {
      $id: id,
      email,
      name,
      emailVerification: false,
      phone: "",
      phoneVerification: false,
      status: true,
      prefs: {},
      registration: new Date().toISOString(),
      labels: [],
      accessedAt: new Date().toISOString(),
    };
  },

  async createEmailPasswordSession(email: string, password: string) {
    const result = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result.token) setToken(result.token);
    return { secret: "jwt-session", userId: result.user?.$id ?? "" };
  },

  async deleteSession(_sessionId: string) {
    clearToken();
  },

  async updatePassword(newPassword: string, oldPassword: string) {
    await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
    });
  },
};

export const TABLE_ID = "org-menu";

export const COLLECTIONS = {
  ORGANIZATIONS: "organizations",
  USER_PROFILES: "user_profiles",
  ORG_MEMBERS: "org_members",
  ORG_INVITATIONS: "org_invitations",
  CLIENTS: "clients",
  TASKS: "tasks",
  TEAMS: "teams",
  BRANCHES: "branches",
  SAVED_TASKS: "saved_tasks",
  MASTER_DATA: "master_data",
} as const;
