"use client"

import * as React from "react"
import {
  CalendarIcon,
  ClipboardListIcon,
  HashIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { SavedTaskModal } from "./saved-task-modal"
import { getSavedTasks, type SavedTask } from "@/lib/data/saved-tasks-data"

function getPriorityClasses(priority: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-rose-50 text-rose-700 ring-rose-600/20"
    case "medium":
      return "bg-amber-50 text-amber-700 ring-amber-600/20"
    case "low":
      return "bg-primary/5 text-primary ring-primary/20"
    default:
      return "bg-slate-50 text-slate-700 ring-slate-600/20"
  }
}

export function SavedTaskTable() {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [viewingTask, setViewingTask] = React.useState<SavedTask | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [tasks, setTasks] = React.useState<SavedTask[]>([])

  React.useEffect(() => {
    getSavedTasks().then(setTasks).catch(() => setTasks([]))
  }, [])

  const toggleAll = () => {
    const pageIds = tasks.map((task) => task.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))

    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pageIds))
    }
  }

  const toggleTask = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleViewTask = (task: SavedTask) => {
    setViewingTask(task)
    setIsViewModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-primary p-4 text-white ">
          <span className="text-sm font-medium">
            {selectedIds.size} tasks selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-primary-foreground hover:bg-primary/80 hover:text-white"
          >
            Clear selection
          </Button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/60">
            <ClipboardListIcon className="text-muted-foreground size-8" />
          </div>
          <p className="text-base font-medium">No saved tasks found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Save a task as a template to see it here.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-background/70 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <Table className="w-full min-w-max table-auto">
            <TableHeader>
              <TableRow className="bg-primary/10 hover:bg-primary/10">
                <TableHead className="w-[50px] px-2 py-3 text-center sm:px-4 sm:py-4">
                  <Checkbox
                    checked={
                      tasks.length > 0 &&
                      selectedIds.size === tasks.length
                    }
                    onChange={toggleAll}
                    aria-label="Select all tasks"
                  />
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  <div className="flex items-center justify-center gap-2">
                    <HashIcon className="size-4" />
                    ID
                  </div>
                </TableHead>
                <TableHead className="px-3 py-3 text-left font-semibold text-primary sm:px-4 sm:py-4">
                  Title
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  Category
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  Assignment
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  Priority
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  Est. Time
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarIcon className="size-4" />
                    Created At
                  </div>
                </TableHead>
                <TableHead className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={cn(
                    "transition-colors hover:bg-primary/5 cursor-pointer",
                    selectedIds.has(task.id) && "bg-primary/5"
                  )}
                  onClick={() => handleViewTask(task)}
                >
                  <TableCell className="px-2 py-3 text-center sm:px-4 sm:py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Select ${task.id}`}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center font-semibold text-primary sm:px-4 sm:py-4">
                    {task.id}
                  </TableCell>
                  <TableCell className="max-w-xs px-3 py-3 sm:px-4 sm:py-4">
                    <p className="font-medium truncate" title={task.title}>{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5" title={task.description}>
                      {task.description}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20">
                      {task.templateCategory}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center text-sm sm:px-4 sm:py-4 capitalize">
                    {task.assignedType}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        getPriorityClasses(task.priority)
                      )}
                    >
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4 text-sm">
                    {task.estimatedTime}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center font-medium text-primary sm:px-4 sm:py-4 text-sm">
                    {task.createdAt}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewTask(task)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PlayIcon className="mr-2 h-4 w-4" />
                          Use Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SavedTaskModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        task={viewingTask}
      />
    </div>
  )
}
