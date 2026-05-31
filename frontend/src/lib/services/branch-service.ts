/**
 * Branch service — CRUD via backend REST API.
 */

import { api } from "@/lib/api/client";
import type { Branch } from "@/types";

export type { Branch };

function mapBranch(doc: any): Branch {
  return {
    id: doc._id ?? doc.id ?? "",
    name: doc.name ?? "",
    address: doc.address,
    managerName: doc.managerName,
    status: doc.status ?? "",
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    deletedAt: doc.deletedAt,
  };
}

export const branchService = {
  async getAllBranches(organizationId?: string): Promise<Branch[]> {
    try {
      const q = organizationId ? `?organizationId=${organizationId}` : "";
      const res = await api.get<{ success: boolean; branches: any[] }>(`/api/branches${q}`);
      return (res.branches ?? []).map(mapBranch);
    } catch (error) {
      console.warn("branchService.getAllBranches error:", error);
      return [];
    }
  },

  async createBranch(data: Partial<Branch>, organizationId?: string): Promise<Branch> {
    const res = await api.post<{ success: boolean; branch: any }>("/api/branches", {
      name: data.name ?? "",
      address: data.address ?? "",
      managerName: data.managerName ?? "",
      status: data.status ?? "Active",
      organizationId: organizationId ?? "",
    });
    return mapBranch(res.branch);
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const res = await api.put<{ success: boolean; branch: any }>(`/api/branches/${id}`, data);
    return mapBranch(res.branch);
  },

  async deleteBranch(id: string): Promise<void> {
    await api.delete(`/api/branches/${id}`);
  },
};
