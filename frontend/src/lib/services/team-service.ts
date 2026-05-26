import { databases, Query, ID, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import type { TeamDoc } from "@/lib/appwrite/types";

export interface UITeam {
  id: string;
  name: string;
  head: string;
  members: number;
  projects: number;
  status: "Active" | "Inactive";
}

function docToTeam(doc: TeamDoc): UITeam {
  return {
    id: doc.$id,
    name: doc.name,
    head: doc.head,
    members: doc.members ?? 0,
    projects: doc.projects ?? 0,
    status: (doc.status === "Active" || doc.status === "Inactive" ? doc.status : "Active") as "Active" | "Inactive",
  };
}

export const teamService = {
  async getAllTeams(organizationId?: string): Promise<UITeam[]> {
    try {
      const queries: any[] = [Query.limit(100)];
      if (organizationId) queries.push(Query.equal("organizationId", organizationId));
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.TEAMS, queries);
      return (res.documents as unknown as TeamDoc[]).map(docToTeam);
    } catch (error) {
      console.warn("teamService.getAllTeams error:", error);
      return [];
    }
  },

  async createTeam(data: Partial<UITeam>, organizationId?: string): Promise<UITeam> {
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.TEAMS, ID.unique(), {
      name: data.name ?? "",
      head: data.head ?? "",
      members: data.members ?? 0,
      projects: data.projects ?? 0,
      status: data.status ?? "Active",
      organizationId: organizationId ?? "",
    });
    return docToTeam(doc as unknown as TeamDoc);
  },

  async updateTeam(id: string, data: Partial<UITeam>): Promise<UITeam> {
    const doc = await databases.updateDocument(DB_ID, COLLECTIONS.TEAMS, id, data);
    return docToTeam(doc as unknown as TeamDoc);
  },

  async deleteTeam(id: string): Promise<void> {
    await databases.deleteDocument(DB_ID, COLLECTIONS.TEAMS, id);
  },

  async getTaskStats(organizationId?: string) {
    const teams = await this.getAllTeams(organizationId);
    const active = teams.filter(t => t.status === "Active").length;
    return {
      totalTeams: teams.length,
      totalMembers: teams.reduce((sum, t) => sum + t.members, 0),
      teamLeads: teams.filter(t => t.head).length,
      departments: active,
    };
  },
};
