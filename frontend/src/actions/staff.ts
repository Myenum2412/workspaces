"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { API_BASE_URL } from "@/lib/api/config";
import { ApiError, ValidationError } from "./errors";
import type { UIStaff } from "@/types";

function mapStaff(doc: any): UIStaff {
  return {
    id: doc._id ?? doc.id ?? "",
    userId: doc.userId ?? "",
    empId: doc.empId ?? "",
    firstName: doc.firstName ?? "",
    lastName: doc.lastName ?? "",
    nickname: doc.nickname ?? doc.firstName ?? "",
    email: doc.email ?? "",
    designation: doc.designation ?? "",
    department: doc.department ?? null,
    status: doc.status ?? "active",
    joiningDate: doc.joiningDate ?? doc.createdAt ?? "",
    mobile: doc.phone ?? doc.mobile ?? "",
    avatar: doc.avatarUrl ?? "",
    employmentType: doc.employmentType ?? null,
    currentExperience: doc.currentExperience ?? null,
    totalExperience: doc.totalExperience ?? null,
    dob: doc.dob ?? "",
    gender: doc.gender ?? "",
    maritalStatus: doc.maritalStatus ?? "",
    sourceOfHire: doc.sourceOfHire ?? null,
    bio: doc.bio ?? "",
    expertise: Array.isArray(doc.expertise) ? doc.expertise : [],
    pan: doc.pan ?? "",
    aadhaar: doc.aadhaar ?? "",
    uan: doc.uan ?? "",
    presentAddress: doc.presentAddress ?? "",
    permanentAddress: doc.permanentAddress ?? "",
    personalPhone: doc.personalPhone ?? "",
    personalEmail: doc.personalEmail ?? "",
    category: doc.category ?? "",
    activeHours: doc.activeHours ?? "8h",
    screenTime: doc.screenTime ?? "6h 45m",
    orgId: doc.organizationId ?? "",
    role: doc.role ?? "",
    joinedAt: doc.joinedAt ?? "",
    workExperience: doc.workEducation ?? [],
    educationDetails: doc.educationDetails ?? [],
    dependentDetails: doc.dependentDetails ?? [],
    socialLinks: doc.socialLinks ?? {},
    exitDate: doc.exitDate ?? "",
    emailVerified: doc.emailVerified ?? false,
    phoneVerified: doc.phoneVerified ?? false,
    profileCompletion: doc.profileCompletion ?? 0,
    lastLogin: doc.lastLogin,
    loginCount: doc.loginCount ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  };
}

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

export async function createStaffAction(formData: FormData) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const email = formData.get("email") as string;
  const firstName = formData.get("firstName") as string;
  if (!email || !firstName) {
    throw new ValidationError({ email: email ? "" : "Email is required", firstName: firstName ? "" : "First name is required" });
  }

  const body: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    body[key] = value;
  });

  const res = await fetch(`${API_BASE_URL}/api/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to create staff", res.status);
  }

  revalidateTag("staff", "default");
  const json = await res.json();
  return mapStaff(json.staff);
}

export async function updateStaffAction(formData: FormData) {
  const staffId = formData.get("staffId") as string;
  if (!staffId) throw new ApiError("Staff ID required", 400);

  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const body: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (key !== "staffId") body[key] = value;
  });

  const res = await fetch(`${API_BASE_URL}/api/staff/${staffId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to update staff", res.status);
  }

  revalidateTag("staff", "default");
  const json = await res.json();
  return mapStaff(json.staff);
}

export async function deleteStaffAction(staffId: string) {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getCsrfHeaders()),
  };

  const res = await fetch(`${API_BASE_URL}/api/staff/${staffId}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(json.error?.message || "Failed to delete staff", res.status);
  }

  revalidateTag("staff", "default");
}
