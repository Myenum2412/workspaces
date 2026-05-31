/**
 * Team service — CRUD via backend REST API.
 */

import { api } from "@/lib/api/client";
import type { Team } from "@/types";

export type { Team };

function mapTeam(doc: any): Team {
  return {
    id: doc._id ?? doc.id ?? "",
    name: doc.name ?? "",
    head: doc.head ?? "",
    members: doc.members ?? 0,
    projects: doc.projects ?? 0,
    status: doc.status ?? "Active",
    organizationId: doc.organizationId ?? "",
    createdAt: doc.createdAt,
    deletedAt: doc.deletedAt,
  };
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const res = await api.get<{ success: boolean; teams: any[] }>("/api/teams");
      return (res.teams ?? []).map(mapTeam);
    } catch (error) {
      console.warn("teamService.getAllTeams error:", error);
      return [];
    }
  },

  async createTeam(data: Partial<Team>): Promise<Team> {
    const res = await api.post<{ success: boolean; team: any }>("/api/teams", {
      name: data.name ?? "",
      head: data.head ?? "",
      members: data.members ?? 0,
      projects: data.projects ?? 0,
      status: data.status ?? "Active",
      organizationId: data.organizationId ?? "",
    });
    return mapTeam(res.team);
  },

  async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
    const res = await api.put<{ success: boolean; team: any }>(`/api/teams/${id}`, data);
    return mapTeam(res.team);
  },

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/api/teams/${id}`);
  },

  async getTaskStats() {
    const teams = await this.getAllTeams();
    const active = teams.filter((t) => t.status === "Active").length;
    return {
      totalTeams: teams.length,
      totalMembers: teams.reduce((sum, t) => sum + t.members, 0),
      teamLeads: teams.filter((t) => t.head).length,
      departments: active,
    };
  },
};
