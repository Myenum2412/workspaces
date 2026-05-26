import { databases, Query, ID, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import type { BranchDoc } from "@/lib/appwrite/types";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  managerName?: string;
  status: string;
}

function docToBranch(doc: BranchDoc): Branch {
  return {
    id: doc.$id,
    name: doc.name,
    address: doc.address,
    managerName: doc.managerName,
    status: doc.status,
  };
}

export const branchService = {
  async getAllBranches(organizationId?: string): Promise<Branch[]> {
    try {
      const queries: any[] = [Query.limit(100)];
      if (organizationId) queries.push(Query.equal("organizationId", organizationId));
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.BRANCHES, queries);
      return (res.documents as unknown as BranchDoc[]).map(docToBranch);
    } catch (error) {
      console.warn("branchService.getAllBranches error:", error);
      return [];
    }
  },

  async createBranch(data: Partial<Branch>, organizationId?: string): Promise<Branch> {
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.BRANCHES, ID.unique(), {
      name: data.name ?? "",
      address: data.address ?? "",
      managerName: data.managerName ?? "",
      status: data.status ?? "Active",
      organizationId: organizationId ?? "",
    });
    return docToBranch(doc as unknown as BranchDoc);
  },

  async updateBranch(id: string, data: Partial<Branch>): Promise<Branch> {
    const doc = await databases.updateDocument(DB_ID, COLLECTIONS.BRANCHES, id, data);
    return docToBranch(doc as unknown as BranchDoc);
  },
};
