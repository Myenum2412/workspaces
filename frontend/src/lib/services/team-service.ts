import { api } from "@/lib/api/client";
import type { Team } from "@/types";

export type { Team };

function mapTeam(doc: Record<string, unknown>): Team {
  return {
    id: (doc._id ?? doc.id ?? "") as string,
    organizationId: (doc.organizationId ?? "") as string,
    workspaceId: (doc.workspaceId ?? "") as string,
    name: (doc.name ?? "") as string,
    description: (doc.description ?? "") as string,
    headUserId: (doc.headUserId ?? doc.head ?? "") as string,
    memberIds: Array.isArray(doc.memberIds)
      ? (doc.memberIds as string[])
      : Array.isArray(doc.members)
        ? (doc.members as string[])
        : [],
    status: (doc.status as Team["status"]) ?? "active",
    createdAt: doc.createdAt as string,
    updatedAt: doc.updatedAt as string,
    deletedAt: (doc.deletedAt as string) ?? null,
  };
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const res = await api.get<{ success: boolean; teams: Record<string, unknown>[] }>("/api/teams");
      return (res.teams ?? []).map(mapTeam);
    } catch (error) {
      console.warn("teamService.getAllTeams error:", error);
      return [];
    }
  },

  async createTeam(data: Partial<Team>): Promise<Team> {
    const res = await api.post<{ success: boolean; team: Record<string, unknown> }>("/api/teams", {
      name: data.name ?? "",
      description: data.description ?? "",
      headUserId: data.headUserId ?? "",
      status: data.status ?? "active",
      organizationId: data.organizationId ?? "",
    });
    return mapTeam(res.team);
  },

  async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
    const res = await api.put<{ success: boolean; team: Record<string, unknown> }>(`/api/teams/${id}`, data);
    return mapTeam(res.team);
  },

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/api/teams/${id}`);
  },

  async getTaskStats() {
    const teams = await this.getAllTeams();
    const active = teams.filter((t) => t.status === "active").length;
    return {
      totalTeams: teams.length,
      totalMembers: teams.reduce((sum, t) => sum + (t.memberIds?.length ?? 0), 0),
      teamLeads: teams.filter((t) => t.headUserId).length,
      departments: active,
    };
  },
};
