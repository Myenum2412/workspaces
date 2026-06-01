import * as React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Task } from "@/lib/data/table-data"
import { cn } from "@/lib/utils"

interface TaskCalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 border-b border-r border-slate-100 bg-slate-50/30" />)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr)

    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString()

    days.push(
      <div key={`day-${d}`} className={cn(
        "h-24 sm:h-32 p-1 sm:p-2 border-b border-r border-slate-100 flex flex-col gap-1 overflow-y-auto",
        isToday ? "bg-primary/5" : "bg-white"
      )}>
        <div className={cn(
          "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
          isToday ? "bg-bg-primary text-primary-foreground" : "text-slate-500"
        )}>
          {d}
        </div>
        <div className="flex flex-col gap-1">
          {dayTasks.map((task) => (
            <div
              key={task.id || task.taskNo}
              onClick={() => onTaskClick(task)}
              className="text-[10px] sm:text-xs px-1.5 py-1 rounded bg-primary/10 text-primary font-medium truncate cursor-pointer hover:bg-primary/20 transition-colors"
              title={task.task}
            >
              {task.task}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <h3 className="text-lg font-bold text-slate-800">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 bg-white" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b bg-slate-50">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-slate-500 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-white">
        {days}
      </div>
    </div>
  )
}
