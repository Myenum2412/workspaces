import { cookies } from "next/headers";
import { cache } from "react";
import { API_BASE_URL } from "@/lib/api/config";
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

function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  return cookies()
    .then((cookieStore) => {
      const token = cookieStore.get("access_token")?.value;
      return token ? { Cookie: `access_token=${token}` } : undefined;
    })
    .catch(() => undefined);
}

export const getAllStaff = cache(async (): Promise<UIStaff[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/staff`, {
      headers,
      next: { revalidate: 60, tags: ["staff"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.staffs ?? []).map(mapStaff);
  } catch {
    return [];
  }
});

export const getStaffStats = cache(async () => {
  const staff = await getAllStaff();
  return {
    totalStaff: staff.length,
    activeNow: staff.filter((s: UIStaff) => s.status === "active").length,
    onLeave: staff.filter((s: UIStaff) => s.status === "inactive" || s.status === "On Leave").length,
    assignedTasks: 0,
  };
});
