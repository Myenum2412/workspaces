/**
 * Client service — CRUD via backend REST API.
 */

import { api } from "@/lib/api/client";
import type { Client } from "@/types";

export type { Client as ClientProfile };

function mapClient(doc: any): Client {
  return {
    id: doc._id ?? doc.id ?? "",
    name: doc.name ?? "",
    contactPerson: doc.contactPerson,
    email: doc.email,
    phone: doc.phone,
    status: doc.status ?? "",
    industry: doc.industry,
    location: doc.location,
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt,
  };
}

function toPayload(data: Partial<Client>): Record<string, unknown> {
  return {
    name: data.name ?? "",
    contactPerson: data.contactPerson ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    status: data.status ?? "Active",
    industry: data.industry ?? "",
    location: data.location ?? "",
    organizationId: data.organizationId ?? "",
  };
}

export const clientService = {
  async uploadLogo(): Promise<string> {
    return "";
  },

  getLogoPreview(): string {
    return "";
  },

  async getClientStats(organizationId?: string) {
    try {
      const q = organizationId ? `?organizationId=${organizationId}` : "";
      const res = await api.get<{ success: boolean; clients: any[] }>(`/api/clients${q}`);
      const clients = res.clients ?? [];
      const now = new Date();
      return {
        totalClients: clients.length,
        activePartners: clients.filter((c: any) => c.status === "Active").length,
        inactiveClients: clients.filter((c: any) => c.status === "Inactive").length,
        newThisMonth: clients.filter((c: any) => {
          if (!c.createdAt) return false;
          const d = new Date(c.createdAt);
          return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
      };
    } catch {
      return { totalClients: 0, activePartners: 0, inactiveClients: 0, newThisMonth: 0 };
    }
  },

  async getAllClients(organizationId?: string): Promise<Client[]> {
    try {
      const q = organizationId ? `?organizationId=${organizationId}` : "";
      const res = await api.get<{ success: boolean; clients: any[] }>(`/api/clients${q}`);
      return (res.clients ?? []).map(mapClient);
    } catch (error) {
      console.warn("clientService.getAllClients error:", error);
      return [];
    }
  },

  async createClient(data: Partial<Client>): Promise<Client> {
    const res = await api.post<{ success: boolean; client: any }>("/api/clients", toPayload(data));
    return mapClient(res.client);
  },

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const res = await api.put<{ success: boolean; client: any }>(`/api/clients/${id}`, toPayload(data));
    return mapClient(res.client);
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/api/clients/${id}`);
  },
};
