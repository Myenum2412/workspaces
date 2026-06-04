/**
 * Employee / User service — CRUD via backend REST API at /api/members.
 * Replaces AppWrite databases.* calls.
 */

import { api } from "@/lib/api/client";
import type { UIEmployee, EmployeeStatus, EmploymentType } from "@/types";

export type { UIEmployee, EmployeeStatus, EmploymentType };

function mapEmployee(doc: any): UIEmployee {
  const first = doc.firstName ?? "";
  const last = doc.lastName ?? "";
  return {
    id: doc._id ?? doc.id ?? "",
    userId: doc.userId ?? "",
    organizationId: doc.organizationId ?? "",
    name: `${first} ${last}`.trim() || doc.email || "",
    empId: doc.empId ?? "",
    firstName: first,
    lastName: last,
    nickname: doc.nickname ?? first,
    email: doc.email ?? "",
    designation: doc.designation ?? "",
    department: doc.department ?? null,
    status: (doc.status as EmployeeStatus) ?? "active",
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

function toPayload(employee: Record<string, any>): Record<string, unknown> {
  return {
    userId: employee.userId ?? "",
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    email: employee.email ?? "",
    phone: employee.mobile ?? employee.phone ?? "",
    designation: employee.designation ?? "",
    department: employee.department ?? "",
    status: employee.status ?? "active",
    joiningDate: employee.joiningDate ?? "",
    employmentType: employee.employmentType ?? "Full Time",
    currentExperience: employee.currentExperience ?? "",
    totalExperience: employee.totalExperience ?? "",
    dob: employee.dob ?? "",
    gender: employee.gender ?? "",
    maritalStatus: employee.maritalStatus ?? "",
    sourceOfHire: employee.sourceOfHire ?? "",
    bio: employee.bio ?? "",
    expertise: employee.expertise ?? [],
    pan: employee.pan ?? "",
    aadhaar: employee.aadhaar ?? "",
    uan: employee.uan ?? "",
    presentAddress: employee.presentAddress ?? "",
    permanentAddress: employee.permanentAddress ?? "",
    personalPhone: employee.personalPhone ?? "",
    personalEmail: employee.personalEmail ?? "",
    category: employee.category ?? "",
    organizationId: employee.orgId ?? "",
    role: employee.role ?? "employee",
    empId: employee.empId ?? "",
    avatarUrl: employee.avatar ?? employee.avatarUrl ?? "",
    nickname: employee.nickname ?? "",
  };
}

export const employeeService = {
  async getAllEmployees(): Promise<UIEmployee[]> {
    try {
      const res = await api.get<{ success: boolean; employees: any[] }>("/api/members");
      return (res.employees ?? []).map(mapEmployee);
    } catch (error) {
      console.warn("employeeService.getAllEmployees error:", error);
      return [];
    }
  },

  async getEmployeeById(id: string): Promise<UIEmployee | null> {
    try {
      const res = await api.get<{ success: boolean; employee: any }>(`/api/members/${id}`);
      return mapEmployee(res.employee);
    } catch {
      return null;
    }
  },

  async createEmployee(data: Record<string, any>): Promise<UIEmployee> {
    const now = new Date().toISOString();
    const first = data.firstName || "New";
    const last = data.lastName || "User";
    const newEmployee: UIEmployee = {
      id: "",
      userId: data.userId || crypto.randomUUID(),
      organizationId: data.organizationId || "",
      name: `${first} ${last}`.trim(),
      empId: data.empId || "",
      firstName: first,
      lastName: last,
      nickname: data.firstName || "New",
      email: data.email || "",
      designation: data.designation || "Employee",
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
      role: data.role || "employee",
      joinedAt: now,
      workExperience: [],
      educationDetails: [],
      dependentDetails: [],
      socialLinks: {},
      exitDate: "",
      ...data,
    };

    const res = await api.post<{ success: boolean; employee: any }>("/api/members", toPayload(newEmployee));
    return mapEmployee(res.employee);
  },

  async updateEmployee(id: string, data: Record<string, any>): Promise<UIEmployee> {
    const res = await api.put<{ success: boolean; employee: any }>(`/api/members/${id}`, toPayload(data));
    return mapEmployee(res.employee);
  },

  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/api/members/${id}`);
  },

  async reactivateEmployee(id: string): Promise<void> {
    await api.put(`/api/members/${id}`, { status: "active" });
  },

  async getEmployeeStats() {
    const employees = await this.getAllEmployees();
    return {
      totalEmployees: employees.length,
      activeNow: employees.filter((e) => e.status === "active").length,
      onLeave: employees.filter((e) => e.status === "inactive" || (e.status as string) === "On Leave").length,
      assignedTasks: 0,
    };
  },
};
