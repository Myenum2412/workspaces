/**
 * Staff / User service — CRUD via backend REST API at /api/staff.
 * Replaces AppWrite databases.* calls.
 */

import { api } from "@/lib/api/client";
import type { UIStaff, StaffStatus, EmploymentType } from "@/types";

export type { UIStaff, StaffStatus, EmploymentType };

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
    status: (doc.status as StaffStatus) ?? "active",
    joiningDate: doc.joiningDate ?? doc.createdAt ?? "",
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
    presentAddress: doc.presentAddress ?? doc.address?.street ?? "",
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
  };
}

function toPayload(staff: Record<string, any>): Record<string, unknown> {
  return {
    userId: staff.userId ?? "",
    firstName: staff.firstName ?? "",
    lastName: staff.lastName ?? "",
    email: staff.email ?? "",
    phone: staff.mobile ?? staff.phone ?? "",
    designation: staff.designation ?? "",
    department: staff.department ?? "",
    status: staff.status ?? "active",
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
    empId: staff.empId ?? "",
    avatarUrl: staff.avatar ?? staff.avatarUrl ?? "",
    nickname: staff.nickname ?? "",
  };
}

export const staffService = {
  async getAllStaff(): Promise<UIStaff[]> {
    try {
      const res = await api.get<{ success: boolean; staffs: any[] }>("/api/staff");
      return (res.staffs ?? []).map(mapStaff);
    } catch (error) {
      console.warn("staffService.getAllStaff error:", error);
      return [];
    }
  },

  async getStaffById(id: string): Promise<UIStaff | null> {
    try {
      const res = await api.get<{ success: boolean; staff: any }>(`/api/staff/${id}`);
      return mapStaff(res.staff);
    } catch {
      return null;
    }
  },

  async createStaff(data: Record<string, any>): Promise<UIStaff> {
    const now = new Date().toISOString();
    const newStaff: UIStaff = {
      id: "",
      userId: data.userId || crypto.randomUUID(),
      empId: data.empId || "",
      firstName: data.firstName || "New",
      lastName: data.lastName || "User",
      nickname: data.firstName || "New",
      email: data.email || "",
      designation: data.designation || "Staff",
      department: data.department || "",
      status: "active",
      joiningDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-"),
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
      workExperience: [],
      educationDetails: [],
      dependentDetails: [],
      socialLinks: {},
      exitDate: "",
      ...data,
    };

    const res = await api.post<{ success: boolean; staff: any }>("/api/staff", toPayload(newStaff));
    return mapStaff(res.staff);
  },

  async updateStaff(id: string, data: Record<string, any>): Promise<UIStaff> {
    const res = await api.put<{ success: boolean; staff: any }>(`/api/staff/${id}`, toPayload(data));
    return mapStaff(res.staff);
  },

  async deleteStaff(id: string): Promise<void> {
    await api.delete(`/api/staff/${id}`);
  },

  async reactivateStaff(id: string): Promise<void> {
    await api.put(`/api/staff/${id}`, { status: "active" });
  },

  async getStaffStats() {
    const staff = await this.getAllStaff();
    return {
      totalStaff: staff.length,
      activeNow: staff.filter((s) => s.status === "active").length,
      onLeave: staff.filter((s) => s.status === "inactive" || s.status === "On Leave").length,
      assignedTasks: 0,
    };
  },
};
