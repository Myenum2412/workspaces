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
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
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
      className: "border-primary/20 bg-card",
      titleClassName: "text-primary",
      valueClassName: "text-primary",
      iconClassName: "text-primary",
    },
    {
      title: "In Progress Task",
      value: stats.inProgressTask,
      description: "Currently in progress",
      icon: ClipboardCheck,
      className: "border-primary/20 bg-card",
      titleClassName: "text-foreground",
      valueClassName: "text-primary",
      iconClassName: "text-muted-foreground",
    },
    {
      title: "Team Task",
      value: stats.teamTask,
      description: "Assigned to teams",
      icon: Users,
      className: "border-primary/20 bg-card",
      titleClassName: "text-foreground",
      valueClassName: "text-primary",
      iconClassName: "text-muted-foreground",
    },
    {
      title: "Pending Task",
      value: stats.pendingTask,
      description: "Waiting to start",
      icon: Clock,
      className: "border-primary/20 bg-card",
      titleClassName: "text-foreground",
      valueClassName: "text-primary",
      iconClassName: "text-muted-foreground",
    },
    {
      title: "Postponed Task",
      value: stats.postponedTask,
      description: "Paused or on hold",
      icon: Layers,
      className: "border-primary/20 bg-card",
      titleClassName: "text-foreground",
      valueClassName: "text-primary",
      iconClassName: "text-muted-foreground",
    },
    {
      title: "Repeated Task",
      value: stats.repeatedTask,
      description: "Recurring tasks",
      icon: RefreshCw,
      className: "border-primary/20 bg-card",
      titleClassName: "text-foreground",
      valueClassName: "text-primary",
      iconClassName: "text-muted-foreground",
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
              className="bg-primary hover:bg-primary/80 text-primary-foreground "
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
            <TaskTablePage title="" showPageHeader={false} isTeamTask={false} categoryFilter={selectedCategory} />
          </div>

          {/* Team Tasks Table */}
          <div className="space-y-4">
            <TaskTablePage tableTitle="Team Task" showPageHeader={false} isTeamTask={true} categoryFilter={selectedCategory} />
          </div>
        </CardContent>

      <TaskAllocationModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </section>
  )
}
