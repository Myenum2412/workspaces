"use client"

import * as React from "react"
import { useEffect } from "react"
import { TaskTablePage } from "../task-table-page"
import { TaskAllocationModal } from "@/components/tasks/task-allocation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { taskService } from "@/lib/services/task-service"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarDays, Clock, ClipboardCheck, Layers, RefreshCw, UserPlusIcon, Users } from "lucide-react"

export default function TasksPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const { data: stats = {
    todayTask: 0,
    inProgressTask: 0,
    teamTask: 0,
    pendingTask: 0,
    postponedTask: 0,
    repeatedTask: 0,
    overdueTask: 0,
  } } = useQuery({
    queryKey: ["task-stats"],
    queryFn: () => taskService.getTaskStats(),
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["task-stats"] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  const statCards = [
    {
      title: "Today task",
      value: stats.todayTask,
      description: "Due today",
      icon: CalendarDays,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-emerald-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-emerald-600",
    },
    {
      title: "In Progress Task",
      value: stats.inProgressTask,
      description: "Currently in progress",
      icon: ClipboardCheck,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
    {
      title: "Team Task",
      value: stats.teamTask,
      description: "Assigned to teams",
      icon: Users,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
    {
      title: "Pending Task",
      value: stats.pendingTask,
      description: "Waiting to start",
      icon: Clock,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
    {
      title: "Postponed Task",
      value: stats.postponedTask,
      description: "Paused or on hold",
      icon: Layers,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
    {
      title: "Repeated Task",
      value: stats.repeatedTask,
      description: "Recurring tasks",
      icon: RefreshCw,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
    {
      title: "Overdue Task",
      value: stats.overdueTask,
      description: "Past due date",
      icon: AlertCircle,
      className: "border-emerald-100 bg-card",
      titleClassName: "text-slate-700",
      valueClassName: "text-emerald-950",
      iconClassName: "text-slate-600",
    },
  ]

  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Tasks
              </CardTitle>
              <CardDescription>
                Manage and monitor all delegated tasks.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white "
            >
              <UserPlusIcon className="mr-2 size-4" />
              Allocate Task
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title} className={`overflow-hidden  ${card.className}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={`text-sm font-medium ${card.titleClassName}`}>
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.valueClassName}`}>{card.value}</div>
                    <p className={`text-xs mt-1 ${card.titleClassName}`}>{card.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Individual Tasks Table */}
          <div className="space-y-4">
            <TaskTablePage title="" showPageHeader={false} isTeamTask={false} />
          </div>

          {/* Team Tasks Table */}
          <div className="space-y-4">
            <TaskTablePage tableTitle="Team Task" showPageHeader={false} isTeamTask={true} />
          </div>
        </CardContent>
      </Card>

      <TaskAllocationModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </section>
  )
}
