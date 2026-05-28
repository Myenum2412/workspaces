"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { TaskTablePage } from "../task-table-page"
import { TaskAllocationModal } from "@/components/tasks/task-allocation-modal"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { taskService } from "@/lib/services/task-service"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarDays, Clock, ClipboardCheck, Layers, RefreshCw, UserPlusIcon, Users } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"

export default function MyTasksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [userName, setUserName] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setUserName(data.user?.name || data.user?.email || "User")
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    fetchUser()
  }, [])

  const { data: stats = {
    todayTask: 0,
    inProgressTask: 0,
    teamTask: 0,
    pendingTask: 0,
    postponedTask: 0,
    repeatedTask: 0,
    overdueTask: 0,
  } } = useQuery({
    queryKey: ["my-task-stats", userName],
    queryFn: () => userName ? taskService.getMyTaskStats(userName) : Promise.resolve({
      todayTask: 0, inProgressTask: 0, teamTask: 0, pendingTask: 0,
      postponedTask: 0, repeatedTask: 0, overdueTask: 0,
    }),
    enabled: !!userName,
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userName) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["my-task-stats", userName] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient, userName])

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
      className: "border-red-100 bg-red-50/30",
      titleClassName: "text-red-700",
      valueClassName: "text-red-950",
      iconClassName: "text-red-600",
    },
  ]

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                My Tasks
              </CardTitle>
              <CardDescription>
                Manage and monitor your assigned tasks.
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
              <ToggleSwitch 
                checked={showAdvanced} 
                onChange={setShowAdvanced} 
                label="Advanced View" 
              />
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white "
              >
                <UserPlusIcon className="mr-2 size-4" />
                Allocate Task
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {statCards.map((card) => {
              const Icon = card.icon
              return (
                <Card 
                  key={card.title} 
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${card.title === selectedCategory ? 'ring-2 ring-emerald-500' : ''} ${card.className}`}
                  onClick={() => setSelectedCategory(card.title === selectedCategory ? "All" : card.title)}
                >
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
            <TaskTablePage 
              title="" 
              showPageHeader={false} 
              isTeamTask={false} 
              categoryFilter={selectedCategory} 
              assignedTo={userName || undefined} 
            />
          </div>

          {/* Team Tasks Table */}
          <div className="space-y-4">
            <TaskTablePage 
              tableTitle="Team Task" 
              showPageHeader={false} 
              isTeamTask={true} 
              categoryFilter={selectedCategory} 
              assignedTo={userName || undefined} 
            />
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
