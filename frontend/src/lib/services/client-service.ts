import { databases, Query, ID, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import type { ClientDoc } from "@/lib/appwrite/types";

export interface ClientProfile {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: string;
  industry?: string;
  location?: string;
  logoId?: string;
  createdAt: string;
  updatedAt: string;
}

function docToProfile(doc: ClientDoc): ClientProfile {
  return {
    id: doc.$id,
    name: doc.name,
    contactPerson: doc.contactPerson,
    email: doc.email,
    phone: doc.phone,
    status: doc.status,
    industry: doc.industry,
    location: doc.location,
    logoId: doc.logoId,
    createdAt: doc.createdAt ?? "",
    updatedAt: doc.updatedAt ?? "",
  };
}

function profileToDoc(data: Partial<ClientProfile>): Record<string, unknown> {
  return {
    name: data.name ?? "",
    contactPerson: data.contactPerson ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    status: data.status ?? "Active",
    industry: data.industry ?? "",
    location: data.location ?? "",
    logoId: data.logoId ?? "",
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export const clientService = {
  async uploadLogo(_file: File): Promise<string> {
    return "";
  },

  getLogoPreview(_logoId: string): string {
    return "";
  },

  async getClientStats(organizationId?: string) {
    try {
      const queries: any[] = [Query.limit(500)];
      if (organizationId) queries.push(Query.equal("organizationId", organizationId));
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.CLIENTS, queries);
      const clients = res.documents as unknown as ClientDoc[];
      const now = new Date();
      return {
        totalClients: clients.length,
        activePartners: clients.filter(c => c.status === "Active").length,
        inactiveClients: clients.filter(c => c.status === "Inactive").length,
        newThisMonth: clients.filter(c => {
          const d = new Date(c.createdAt ?? "");
          return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
      };
    } catch {
      return { totalClients: 0, activePartners: 0, inactiveClients: 0, newThisMonth: 0 };
    }
  },

  async getAllClients(organizationId?: string): Promise<ClientProfile[]> {
    try {
      const queries: any[] = [Query.limit(500)];
      if (organizationId) queries.push(Query.equal("organizationId", organizationId));
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.CLIENTS, queries);
      return (res.documents as unknown as ClientDoc[]).map(docToProfile);
    } catch (error) {
      console.warn("clientService.getAllClients error:", error);
      return [];
    }
  },

  async createClient(data: Partial<ClientProfile>, organizationId?: string): Promise<ClientProfile> {
    const doc = await databases.createDocument(
      DB_ID,
      COLLECTIONS.CLIENTS,
      ID.unique(),
      { ...profileToDoc(data), organizationId: organizationId ?? "" }
    );
    return docToProfile(doc as unknown as ClientDoc);
  },

  async updateClient(id: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    const payload = profileToDoc(data);
    payload.updatedAt = new Date().toISOString();
    const doc = await databases.updateDocument(DB_ID, COLLECTIONS.CLIENTS, id, payload);
    return docToProfile(doc as unknown as ClientDoc);
  },

  async deleteClient(id: string): Promise<void> {
    await databases.deleteDocument(DB_ID, COLLECTIONS.CLIENTS, id);
  },
};
