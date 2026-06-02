"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError } from "./errors";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    return token ? { Cookie: `access_token=${token}` } : {};
  } catch {
    return {};
  }
}

async function getCsrfHeaders(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
      method: "GET",
      cache: "no-store",
    });
    const cookieHeader = res.headers.get("set-cookie");
    const match = cookieHeader?.match(/csrf_token=([^;]+)/);
    if (match) return { "X-CSRF-Token": decodeURIComponent(match[1]) };
  } catch { /* ignore */ }
  return {};
}

export async function updateProfileAction(formData: FormData) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const body: Record<string, unknown> = {};
  const allowedFields = [
    "firstName", "lastName", "phone", "designation", "department",
    "bio", "personalEmail", "personalPhone", "gender", "maritalStatus", "dob",
    "presentAddress", "permanentAddress", "expertise", "avatarUrl",
  ];

  for (const field of allowedFields) {
    const value = formData.get(field);
    if (value !== null && value !== undefined && value !== "") {
      if (field === "expertise") {
        const raw = value as string;
        body[field] = raw ? raw.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      } else {
        body[field] = value;
      }
    }
  }

  // Handle address subdocument
  const addressFields = ["street", "city", "state", "country", "postalCode"];
  const address: Record<string, string> = {};
  for (const f of addressFields) {
    const value = formData.get(`address${f.charAt(0).toUpperCase() + f.slice(1)}`);
    if (value) address[f] = value as string;
  }
  // Also check flat keys
  for (const f of addressFields) {
    const value = formData.get(f);
    if (value) address[f] = value as string;
  }
  if (Object.keys(address).length > 0) body.address = address;

  const csrfToken = await getCsrfHeaders();

  const res = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers, ...csrfToken },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to update profile", res.status);
  }

  revalidateTag("profile", "default");
  return { success: true };
}

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new ApiError("No file provided", 400);

  const headers = await getAuthHeaders();
  const csrfHeaders = await getCsrfHeaders();

  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
    method: "POST",
    headers: { ...headers, ...csrfHeaders },
    body: uploadFormData,
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to upload avatar", res.status);
  }

  revalidateTag("profile", "default");
  return res.json();
}

export async function setAdminUserStatusAction(userId: string, status: string, reason?: string) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const res = await fetch(`${API_BASE_URL}/api/profile/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ status, reason }),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to update user status", res.status);
  }

  revalidateTag("staff", "default");
  return { success: true };
}
