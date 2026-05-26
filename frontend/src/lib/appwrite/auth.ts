import { API_BASE_URL } from "../api/config";

const BACKEND_URL = API_BASE_URL;

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

async function apiCall(path: string, options: RequestInit = {}) {
  const token = getToken();
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

function handleError(error: unknown): { success: false; error: string } {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return { success: false, error: message };
}

interface RegisterParams {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
  phone?: string;
  designation?: string;
}

export async function registerWithOrganization(params: RegisterParams) {
  try {
    const { name, email, password, organizationName } = params;
    const result = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        companyName: organizationName || `${name}'s Organization`,
        category: "Other",
        companyRange: "1-10",
      }),
    });

    if (result.token) setToken(result.token);
    return { success: true as const, session: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const result = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (result.token) setToken(result.token);
    return { success: true as const, session: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function logoutUser() {
  clearToken();
  return { success: true };
}

export async function getAuthSession() {
  try {
    const result = await apiCall("/api/auth/me");

    if (!result.user) {
      return { success: false as const, error: "Not authenticated" };
    }

    return {
      success: true as const,
      session: {
        user: {
          $id: result.user.$id,
          name: result.user.name || `${result.user.firstName ?? ""} ${result.user.lastName ?? ""}`.trim(),
          email: result.user.email,
          emailVerification: true,
          phone: "",
          phoneVerification: false,
          status: true,
          prefs: {},
          registration: "",
          labels: [],
          accessedAt: new Date().toISOString(),
        },
        profile: result.user,
        organization: result.organization,
        membership: result.membership,
      },
    };
  } catch {
    return { success: false as const, error: "Not authenticated" };
  }
}

export async function inviteUserToOrg(params: {
  email: string;
  role: string;
  organizationId: string;
  invitedBy: string;
}) {
  try {
    const token = crypto.randomUUID();
    await apiCall("/api/invites/send", {
      method: "POST",
      body: JSON.stringify({
        email: params.email,
        inviteToken: token,
        organizationName: "",
        inviterName: params.invitedBy,
        role: params.role,
      }),
    });
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function acceptInvitation(token: string, userId: string) {
  try {
    const result = await apiCall("/api/db", {
      method: "POST",
      body: JSON.stringify({
        method: "getDocument",
        collectionId: "org_invitations",
        documentId: token,
      }),
    });
    return { success: true, invite: result };
  } catch (error) {
    return handleError(error);
  }
}

export { getToken, clearToken };
