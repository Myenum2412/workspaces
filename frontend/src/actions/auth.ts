"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { API_BASE_URL } from "@/lib/api/config";
import { AuthError } from "./errors";

async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return "";
  // CSRF token is set as cookie by backend
  return "";
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new AuthError("Email and password are required");
  }

  try {
    // Get CSRF token first
    const csrfRes = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: "GET",
      cache: "no-store",
    });
    let csrfToken = "";
    if (csrfRes.ok) {
      const cookieHeader = csrfRes.headers.get("set-cookie");
      const match = cookieHeader?.match(/csrf_token=([^;]+)/);
      if (match) csrfToken = decodeURIComponent(match[1]);
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      throw new AuthError(json.error?.message || "Invalid email or password");
    }

    // Determine redirect based on role
    try {
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Cookie: `access_token=${json.accessToken || ""}`,
        },
        cache: "no-store",
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.user?.role === "staff") {
          redirect("/staff/dashboard");
        }
      }
    } catch {
      // Fall through to default redirect
    }

    redirect("/workspace");
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Login failed. Please try again.");
  }
}

export async function signupAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const companyName = formData.get("companyName") as string;
  const companyRange = formData.get("companyRange") as string;
  const email = formData.get("email") as string;

  if (!firstName || !lastName || !companyName || !companyRange || !email) {
    throw new AuthError("All fields are required");
  }

  try {
    const csrfRes = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: "GET",
      cache: "no-store",
    });
    let csrfToken = "";
    if (csrfRes.ok) {
      const cookieHeader = csrfRes.headers.get("set-cookie");
      const match = cookieHeader?.match(/csrf_token=([^;]+)/);
      if (match) csrfToken = decodeURIComponent(match[1]);
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({
        firstName,
        lastName,
        companyName,
        companyRange,
        email,
        category: "Other",
      }),
      credentials: "include",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      throw new AuthError(json.error?.message || "Registration failed");
    }

    // Redirect to login with success message
    redirect("/login?registered=true");
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Registration failed. Please try again.");
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (accessToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `access_token=${accessToken}`,
        },
        cache: "no-store",
      });
    }
  } catch {
    // Ignore logout API errors
  }

  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    throw new AuthError("Email is required");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new AuthError(json.error?.message || "Failed to send reset link");
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError("Failed to send reset link");
  }
}
