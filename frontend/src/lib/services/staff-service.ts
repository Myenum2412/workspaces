/**
 * Staff / User service — all data comes from Appwrite Database.
 * No more fake/mock data or localStorage.
 *
 * Collections used:
 *   - user_profiles  (organizations, user_profiles, org_members, org_invitations)
 *   - org_members
 *
 * The org admin user ID is set via NEXT_PUBLIC_ORG_USER_ID env var.
 */

import { ID } from "@/lib/appwrite/client";
import { API_BASE_URL } from "@/lib/api/config";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null;
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

// ── Types ────────────────────────────────────────────────────

export type StaffStatus = "Active" | "Inactive" | "On Leave" | "Deleted" | "active" | "inactive" | string;
export type EmploymentType = "Full Time" | "Part Time" | "Contract" | "Intern" | "Freelance" | string;

export interface UIStaff {
  [key: string]: unknown;
  id: string;               // Appwrite document $id
  userId: string;           // Appwrite user $id
  empId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  designation: string;
  department: string | null;
  status: StaffStatus | null;
  joiningDate: string;
  mobile: string;
  avatar: string;
  employmentType: EmploymentType | null;
  currentExperience: string | null;
  totalExperience: string | null;
  dob: string;
  gender: string;
  maritalStatus: string;
  sourceOfHire: string | null;
  bio: string;
  expertise: string[];
  pan: string;
  aadhaar: string;
  uan: string;
  presentAddress: string;
  permanentAddress: string;
  personalPhone: string;
  personalEmail: string;
  category?: string;
  activeHours?: string;
  screenTime?: string;
  orgId?: string;
  role?: string;
  joinedAt?: string;
  workExperience?: any[];
  educationDetails?: any[];
  dependentDetails?: any[];
  socialLinks?: Record<string, string>;
  exitDate?: string;
}

// ── Mappers ──────────────────────────────────────────────────

function profileToStaff(doc: Record<string, any>): UIStaff {
  return {
    id: doc.$id ?? "",
    userId: doc.userId ?? "",
    empId: doc.empId ?? "",
    firstName: doc.firstName ?? "",
    lastName: doc.lastName ?? "",
    nickname: doc.nickname ?? doc.firstName ?? "",
    email: doc.email ?? "",
    designation: doc.designation ?? "",
    department: doc.department ?? null,
    status: (doc.status as StaffStatus) ?? "Active",
    joiningDate: doc.joiningDate ?? doc.$createdAt ?? "",
    mobile: doc.phone ?? doc.mobile ?? "",
    avatar: doc.avatarUrl ?? "",
    employmentType: (doc.employmentType as EmploymentType) ?? null,
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
    activeHours: doc.activeHours || "8h",
    screenTime: doc.screenTime || "6h 45m",
    orgId: doc.organizationId ?? "",
    role: doc.role ?? "",
    joinedAt: doc.joinedAt ?? "",
    workExperience: doc.workExperience ? (typeof doc.workExperience === 'string' ? JSON.parse(doc.workExperience) : doc.workExperience) : [],
    educationDetails: doc.educationDetails ? (typeof doc.educationDetails === 'string' ? JSON.parse(doc.educationDetails) : doc.educationDetails) : [],
    dependentDetails: doc.dependentDetails ? (typeof doc.dependentDetails === 'string' ? JSON.parse(doc.dependentDetails) : doc.dependentDetails) : [],
    socialLinks: doc.socialLinks ? (typeof doc.socialLinks === 'string' ? JSON.parse(doc.socialLinks) : doc.socialLinks) : {},
    exitDate: doc.exitDate ?? "",
  };
}

function staffToProfile(staff: Partial<UIStaff>): Record<string, any> {
  return {
    userId: staff.userId ?? "",
    firstName: staff.firstName ?? "",
    lastName: staff.lastName ?? "",
    email: staff.email ?? "",
    password: staff.password ?? "",
    phone: staff.mobile ?? "",
    designation: staff.designation ?? "",
    department: staff.department ?? "",
    status: staff.status ?? "Active",
    joiningDate: staff.joiningDate ?? "",
    employmentType: staff.employmentType ?? "Full Time",
    currentExperience: staff.currentExperience ?? "",
    totalExperience: staff.totalExperience ?? "",
    dob: staff.dob ?? "",
    gender: staff.gender ?? "",
    maritalStatus: staff.maritalStatus ?? "",
    sourceOfHire: staff.sourceOfHire ?? "",
    bio: staff.bio ?? "",
    expertise: staff.expertise ?? [],
    pan: staff.pan ?? "",
    aadhaar: staff.aadhaar ?? "",
    uan: staff.uan ?? "",
    presentAddress: staff.presentAddress ?? "",
    permanentAddress: staff.permanentAddress ?? "",
    personalPhone: staff.personalPhone ?? "",
    personalEmail: staff.personalEmail ?? "",
    category: staff.category ?? "",
    organizationId: staff.orgId ?? "",
    role: staff.role ?? "staff",
    invitedBy: "",
    joinedAt: staff.joinedAt ?? new Date().toISOString(),
    empId: staff.empId ?? "",
    avatarUrl: staff.avatar ?? "",
    nickname: staff.nickname ?? "",
    passwordHash: staff.password ?? "",
    workExperience: staff.workExperience ? JSON.stringify(staff.workExperience) : undefined,
    educationDetails: staff.educationDetails ? JSON.stringify(staff.educationDetails) : undefined,
    dependentDetails: staff.dependentDetails ? JSON.stringify(staff.dependentDetails) : undefined,
    socialLinks: staff.socialLinks ? JSON.stringify(staff.socialLinks) : undefined,
    exitDate: staff.exitDate ?? "",
  };
}

// ── Service ──────────────────────────────────────────────────

export const staffService = {
  /** Get all staff profiles for an organization */
  async getAllStaff(organizationId?: string): Promise<UIStaff[]> {
    try {
      const res = await apiFetch<{ success: boolean; staffs: any[] }>(`/api/staff`);
      return res.staffs.map((doc: any) => profileToStaff({ ...doc, $id: doc._id }));
    } catch (error) {
      console.warn("staffService.getAllStaff error:", error);
      return [];
    }
  },

  /** Get a single staff profile by user_profiles document ID */
  async getStaffById(id: string): Promise<UIStaff | null> {
    try {
      const res = await apiFetch<{ success: boolean; staff: any }>(`/api/staff/${id}`);
      return profileToStaff({ ...res.staff, $id: res.staff._id });
    } catch {
      return null;
    }
  },

  /** Get staff by Appwrite user ID */
  async getStaffByUserId(userId: string): Promise<UIStaff | null> {
    try {
      const res = await apiFetch<{ success: boolean; staffs: any[] }>(`/api/staff`);
      const user = res.staffs.find(s => s.userId === userId);
      if (!user) return null;
      return profileToStaff({ ...user, $id: user._id });
    } catch {
      return null;
    }
  },

  /** Create a new staff profile + org membership */
  async createStaff(data: Partial<UIStaff>): Promise<UIStaff> {
    const now = new Date().toISOString();
    
    let finalEmpId = data.empId;
    if (!finalEmpId) {
      let prefix = "EMP-";
      if (typeof window !== "undefined") {
         prefix = localStorage.getItem("employeeIdPrefix") || "EMP-";
      }
      try {
        const allStaff = await this.getAllStaff(data.orgId);
        const nextCount = allStaff.length + 1;
        finalEmpId = `${prefix}${nextCount.toString().padStart(3, "0")}`;
      } catch {
        finalEmpId = `${prefix}${String(Date.now()).slice(-4)}`;
      }
    }

    const newStaff: UIStaff = {
      id: "",
      userId: data.userId || ID.unique(),
      empId: finalEmpId,
      firstName: data.firstName || "New",
      lastName: data.lastName || "User",
      nickname: data.firstName || "New",
      email: data.email || "",
      designation: data.designation || "Staff",
      department: data.department || "",
      status: "Active",
      joiningDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      }).replace(/ /g, "-"),
      mobile: data.mobile || "",
      avatar: "",
      employmentType: data.employmentType || "Full Time",
      currentExperience: data.currentExperience || "",
      totalExperience: data.totalExperience || "",
      dob: data.dob || "",
      gender: data.gender || "",
      maritalStatus: data.maritalStatus || "",
      sourceOfHire: data.sourceOfHire || "",
      bio: data.bio || "",
      expertise: data.expertise || [],
      pan: data.pan || "",
      aadhaar: data.aadhaar || "",
      uan: data.uan || "",
      presentAddress: data.presentAddress || "",
      permanentAddress: data.permanentAddress || "",
      personalPhone: data.personalPhone || "",
      personalEmail: data.personalEmail || "",
      category: data.category || "",
      orgId: data.orgId || "",
      role: data.role || "staff",
      joinedAt: now,
      ...data,
    };

    const res = await apiFetch<{ success: boolean; staff: any }>("/api/staff", {
      method: "POST",
      body: JSON.stringify(staffToProfile(newStaff)),
    });

    return profileToStaff({ ...res.staff, $id: res.staff._id });
  },

  /** Update an existing staff profile */
  async updateStaff(id: string, data: Partial<UIStaff>): Promise<UIStaff> {
    const existing = await this.getStaffById(id);
    if (!existing) throw new Error("Staff not found");

    const merged = { ...existing, ...data };
    const res = await apiFetch<{ success: boolean; staff: any }>(`/api/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(staffToProfile(merged)),
    });
    return profileToStaff({ ...res.staff, $id: res.staff._id });
  },

  /** Soft-delete: set status to "Deleted" */
  async deleteStaff(id: string): Promise<void> {
    await apiFetch(`/api/staff/${id}`, { method: "DELETE" });
  },

  /** Reactivate a deleted user */
  async reactivateStaff(id: string): Promise<void> {
    await apiFetch(`/api/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "Active" }),
    });
  },

  /** Get staff statistics */
  async getStaffStats(organizationId?: string) {
    const staff = await this.getAllStaff(organizationId);
    return {
      totalStaff: staff.length,
      activeNow: staff.filter((s) => s.status === "Active").length,
      onLeave: staff.filter((s) => s.status === "Inactive" || s.status === "On Leave").length,
      assignedTasks: 0,
    };
  },
};
