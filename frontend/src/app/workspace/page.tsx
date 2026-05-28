"use client"

import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { TaskTablePage } from "./task-table-page"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck, TrendingUp, Activity, Users } from "lucide-react"
import { taskService } from "@/lib/services/task-service"

export default function MyTaskPage() {
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskService.getAllTasks(),
  })

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status.toLowerCase() === 'closed' || t.status.toLowerCase() === 'verified').length
  const pendingTasks = tasks.filter(t => t.status.toLowerCase() === 'open' || t.status.toLowerCase() === 'pending').length
  const highPriorityTasks = tasks.filter(t => t.priority.toLowerCase() === 'high').length

  return (
    <section className="space-y-6">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            My Tasks Overview
          </CardTitle>
          <CardDescription>
            Overview for the My Task workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Overview
                </CardTitle>
                <Activity className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-950">Active</div>
                <div className="flex items-center gap-1 text-xs text-slate-700">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">System Status</span>
                  <span className="text-muted-foreground">Optimal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Tasks
                </CardTitle>
                <ClipboardCheck className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-950">{totalTasks}</div>
                <div className="flex items-center gap-1 text-xs text-slate-700">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-medium">{completedTasks} completed</span>
                  <span className="text-muted-foreground">this period</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Pending Tasks
                </CardTitle>
                <Users className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-950">{pendingTasks}</div>
                <div className="flex items-center gap-1 text-xs text-slate-700">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">In Progress</span>
                  <span className="text-muted-foreground">awaiting action</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  High Priority
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-950">{highPriorityTasks}</div>
                <div className="flex items-center gap-1 text-xs text-slate-700">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">Urgent</span>
                  <span className="text-muted-foreground">requires attention</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TaskTablePage />
            </Suspense>
          </div>
        </CardContent>
    </section>
  )
}
