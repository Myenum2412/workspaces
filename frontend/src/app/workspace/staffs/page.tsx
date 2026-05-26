"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddStaffDialog } from "./add-staff-dialog"
import { StaffTablePage } from "./staff-table-page"
import { Users, UserCheck, UserX, Briefcase } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { staffService } from "@/lib/services/staff-service"

export default function StaffsPage() {
  const { data: stats = { totalStaff: 0, activeNow: 0, onLeave: 0, assignedTasks: 0 } } = useQuery({
    queryKey: ["staff-stats"],
    queryFn: () => staffService.getStaffStats(),
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Staff Management
              </CardTitle>
              <CardDescription>
                Manage staff records, responsibilities, and availability.
              </CardDescription>
            </div>
            <AddStaffDialog />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Staff
                </CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.totalStaff}</div>
                <p className="text-xs text-slate-700 mt-1">All registered members</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Active Now
                </CardTitle>
                <UserCheck className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.activeNow}</div>
                <p className="text-xs text-slate-700 mt-1">Currently working</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  On Leave
                </CardTitle>
                <UserX className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.onLeave}</div>
                <p className="text-xs text-slate-700 mt-1">Away today</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Assigned Tasks
                </CardTitle>
                <Briefcase className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{stats.assignedTasks}</div>
                <p className="text-xs text-slate-700 mt-1">Across all staff</p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Table */}
          <StaffTablePage />
        </CardContent>
      </Card>
    </section>
  )
}
