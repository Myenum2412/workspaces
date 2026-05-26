"use client"

import * as React from "react"
import { TeamFlow } from "./team-flow"
import { TeamsTableView, type Team } from "./teams-table-view"
import { AddTeamDialog } from "./add-team-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { teamService } from "@/lib/services/team-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Users, UserCog, Layers, Building2 } from "lucide-react"

export default function TeamsPage() {
  const { data: stats = { totalTeams: 0, totalMembers: 0, teamLeads: 0, departments: 0 } } = useQuery({
    queryKey: ["team-stats"],
    queryFn: () => teamService.getTaskStats(),
  })

  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)

  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Teams
              </CardTitle>
              <CardDescription>
                Organize teams, roles, and shared work areas.
              </CardDescription>
            </div>
            <AddTeamDialog />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Teams
                </CardTitle>
                <Layers className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.totalTeams}</div>
                <p className="text-xs text-slate-700 mt-1">Active departments</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.totalMembers}</div>
                <p className="text-xs text-slate-700 mt-1">Across all teams</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Team Leads
                </CardTitle>
                <UserCog className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.teamLeads}</div>
                <p className="text-xs text-slate-700 mt-1">Department heads</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Departments
                </CardTitle>
                <Building2 className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.departments}</div>
                <p className="text-xs text-slate-700 mt-1">Organizational units</p>
              </CardContent>
            </Card>
          </div>

          {/* Teams Table */}
          <div>
            <TeamsTableView onTeamClick={setSelectedTeam} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                {selectedTeam?.name[0]}
              </div>
              {selectedTeam?.name} Structure
            </DialogTitle>
            <DialogDescription>
              Visualizing reporting lines and team hierarchy for {selectedTeam?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
            <div className="w-full h-full border rounded-md overflow-hidden bg-muted/5">
              {selectedTeam && <TeamFlow />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
