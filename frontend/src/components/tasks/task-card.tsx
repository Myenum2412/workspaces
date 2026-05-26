"use client"

import * as React from "react"
import { Task } from "@/lib/data/table-data"
import { cn } from "@/lib/utils"
import { CalendarIcon, UserIcon, CheckCircle2Icon } from "lucide-react"

interface TaskCardProps {
  task: Task
  getStatusClasses: (status: string) => string
  getPriorityClasses: (priority: string) => string
}

export function TaskCard({ task, getStatusClasses, getPriorityClasses }: TaskCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4  transition-all hover: lg:hidden">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            {task.taskNo}
          </span>
          <h3 className="font-semibold leading-tight text-emerald-950">
            {task.task}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase",
            getPriorityClasses(task.priority)
          )}
        >
          {task.priority}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <UserIcon className="size-3.5" />
          <span>{task.assignedTo}</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-700 font-medium">
          <CalendarIcon className="size-3.5" />
          <span>{task.dueDate}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span
          className={cn(
            "inline-flex min-w-[80px] items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
            getStatusClasses(task.status)
          )}
        >
          {task.status}
        </span>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2Icon className="size-3.5 text-emerald-500" />
          <span>{task.finalStatus}</span>
        </div>
      </div>
    </div>
  )
}
