"use client"

import * as React from "react"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarIcon,
  ClipboardCheckIcon,
  HashIcon,
  LayoutGridIcon,
  ListIcon,
  MoreHorizontalIcon,
  EyeIcon,
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
import { useDataTable } from "@/hooks/use-data-table"
import { taskService } from "@/lib/services/task-service"
import { statusOptions, pageSizeOptions, Task } from "@/lib/data/table-data"
import { useAnalytics } from "@/hooks/use-analytics"

// Sub-components
import { DataTableToolbar } from "@/components/tasks/data-table-toolbar"
import { DataTablePagination } from "@/components/tasks/data-table-pagination"
import { TaskCard } from "@/components/tasks/task-card"
import { TaskViewModal } from "@/components/tasks/task-view-modal"
import { TaskKanbanView } from "@/components/tasks/task-kanban-view"
import type { Task as AdminTask } from "@/components/admin/tasks/types"

function getStatusClasses(status: string) {
  switch (status) {
    case "Closed":
    case "Verified":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Hold":
    case "Pending":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Open":
    case "Unverified":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Recurring":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Paused":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    default:
      return "bg-slate-50 text-slate-700 border-emerald-100"
  }
}

function getPriorityClasses(priority: string) {
  switch (priority) {
    case "High":
      return "bg-slate-50 text-slate-700 ring-emerald-600/20"
    case "Medium":
      return "bg-slate-50 text-slate-700 ring-emerald-600/20"
    case "Low":
      return "bg-slate-50 text-slate-700 ring-emerald-600/20"
    default:
      return "bg-slate-50 text-slate-700 ring-emerald-600/20"
  }
}

export function TaskTablePage({
  title = "Overview",
  tableTitle = "Task Table",
  showPageHeader = true,
  isTeamTask = false,
  assignedTo,
  categoryFilter = "All",
}: {
  title?: string
  tableTitle?: string
  showPageHeader?: boolean
  isTeamTask?: boolean
  assignedTo?: string
  categoryFilter?: string
}) {
  const { trackEvent, trackInteraction } = useAnalytics("TaskTablePage")

  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ["tasks", assignedTo ?? "all"],
    queryFn: () => {
      trackEvent('fetch_tasks_start')
      if (assignedTo) return taskService.getMyTasks(assignedTo)
      return taskService.getAllTasks()
    },
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!task.id) {
      console.error("Task missing ID")
      return
    }
    try {
      await taskService.updateTaskStatus(task.id, newStatus)
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    } catch (error) {
      console.error("Status update failed:", error)
    }
  }

  const filteredTasks = React.useMemo(() => {
    if (categoryFilter === "All") return tasks;
    
    return tasks.filter((task: Task) => {
      switch (categoryFilter) {
        case "Today task": {
          const today = new Date().toISOString().split('T')[0];
          return task.dueDate === today;
        }
        case "In Progress Task":
          return task.status === "In Progress";
        case "Pending Task":
          return task.status === "Pending";
        case "Postponed Task":
          return task.status === "Hold" || task.status === "Paused" || task.status === "Postponed";
        case "Repeated Task":
          return task.status === "Recurring";
        case "Overdue Task": {
          const today = new Date().toISOString().split('T')[0];
          return task.dueDate < today && !["Closed", "Verified"].includes(task.status);
        }
        case "Team Task":
          return isTeamTask === true;
        default:
          return true;
      }
    });
  }, [tasks, categoryFilter, isTeamTask]);

  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginatedData: paginatedTasks,
    total,
    totalPages,
    startIndex,
  } = useDataTable<Task>({
    data: filteredTasks,
    initialPageSize: 4,
  })

  const [isExpanded, setIsExpanded] = React.useState(!isTeamTask)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [viewingTask, setViewingTask] = React.useState<AdminTask | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'table' | 'kanban'>('table')

  const selectedPageIds = React.useMemo(
    () => paginatedTasks.filter((task) => selectedIds.has(task.taskNo)),
    [paginatedTasks, selectedIds]
  )

  const toggleAll = () => {
    const pageIds = paginatedTasks.map((task) => task.taskNo)
    const allPageTasksSelected = pageIds.every((taskNo) => selectedIds.has(taskNo))

    if (allPageTasksSelected) {
      setSelectedIds((current) => {
        const next = new Set(current)
        pageIds.forEach((taskNo) => next.delete(taskNo))
        return next
      })
    } else {
      setSelectedIds((current) => new Set([...current, ...pageIds]))
    }
  }

  const toggleTask = (taskNo: string) => {
    const next = new Set(selectedIds)
    if (next.has(taskNo)) {
      next.delete(taskNo)
    } else {
      next.add(taskNo)
    }
    setSelectedIds(next)
  }

  const handleViewTask = (task: Task) => {
    // Map table Task to AdminTask for the modal
    const mappedTask: AdminTask = {
      id: task.taskNo,
      taskNumber: task.taskNo,
      title: task.task,
      description: `Task assigned by ${task.delegatedBy}. Current status: ${task.status}.`,
      status: task.status.toLowerCase().replace(' ', '_') as any,
      priority: task.priority.toLowerCase() as any,
      due_date: task.dueDate,
      assigned_to_staff_name: task.assignedTo,
      assignee_type: "staff",
      created_at: new Date().toISOString(),
    }
    trackInteraction(task.taskNo, 'view_task_details')
    setViewingTask(mappedTask)
    setIsViewModalOpen(true)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
        <h2 className="text-xl font-bold text-emerald-800">Something went wrong</h2>
        <p className="mt-2 text-slate-700">{(error as Error).message}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-6 border-slate-300 hover:bg-emerald-100"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {showPageHeader ? (
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Track task delegation, verification, priority, and completion status.
          </p>
        </div>
      ) : null}

      <div className="w-full overflow-hidden rounded-2xl border bg-background ">
        <div className="border-b bg-emerald-50/70 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between relative min-h-[3rem]">
            <div className="shrink-0 space-y-1 lg:w-1/4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-emerald-950">
                  {tableTitle}
                </h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-slate-900">
                  {isLoading ? "..." : total}
                </span>
              </div>
              <p className="hidden text-xs text-slate-900/75 xl:block">
                Manage all delegated tasks in one place.
              </p>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 lg:absolute lg:left-1/2 lg:-translate-x-1/2 w-full lg:max-w-md order-3 lg:order-none pointer-events-none">
              <div className="pointer-events-auto w-full">
                <DataTableToolbar
                  searchOnly={true}
                  searchQuery={searchQuery}
                  onSearchChange={(val) => {
                    setSearchQuery(val)
                    setPage(1)
                  }}
                  filterStatus={filterStatus}
                  onFilterChange={(val) => {
                    setFilterStatus(val)
                    setPage(1)
                  }}
                  statusOptions={statusOptions}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setIsExpanded(!isExpanded)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:w-1/4 lg:justify-end order-2 lg:order-none">
              <div className="flex items-center bg-white/50 p-1 rounded-lg border border-slate-200/50 ">
                <Button 
                  variant={viewMode === 'table' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('table')}
                  className={cn("h-7 px-3 rounded-md transition-all", viewMode === 'table' ? "bg-emerald-600 text-white hover:bg-emerald-700 " : "text-slate-900 hover:bg-emerald-100")}
                >
                  <ListIcon className="size-3.5 mr-1.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Table</span>
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')}
                  className={cn("h-7 px-3 rounded-md transition-all", viewMode === 'kanban' ? "bg-emerald-600 text-white hover:bg-emerald-700 " : "text-slate-900 hover:bg-emerald-100")}
                >
                  <LayoutGridIcon className="size-3.5 mr-1.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Kanban</span>
                </Button>
              </div>
              
              <DataTableToolbar
                filtersOnly={true}
                searchQuery={searchQuery}
                onSearchChange={(val) => {
                  setSearchQuery(val)
                  setPage(1)
                }}
                filterStatus={filterStatus}
                onFilterChange={(val) => {
                  setFilterStatus(val)
                  setPage(1)
                }}
                statusOptions={statusOptions}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
              />
            </div>
          </div>
        </div>

        {isExpanded ? (
          <div className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
            {selectedIds.size > 0 && (
              <div className="animate-in fade-in slide-in-from-top-4 mb-4 flex items-center justify-between rounded-xl bg-emerald-900 p-4 text-white ">
                <span className="text-sm font-medium">
                  {selectedIds.size} tasks selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-emerald-100 hover:bg-emerald-800 hover:text-white"
                >
                  Clear selection
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4 py-8">
                <div className="h-10 w-full animate-pulse rounded-lg bg-emerald-100/50" />
                <div className="h-64 w-full animate-pulse rounded-xl bg-emerald-50/30" />
              </div>
            ) : (
              <div className="space-y-4">
                {viewMode === 'table' ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="w-full overflow-auto rounded-xl border bg-background/70 max-h-[calc(100vh-22rem)] scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                      <Table className="w-full min-w-max table-auto">
                        <TableHeader className="sticky top-0 z-10">
                          <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
                            <TableHead className="w-[50px] px-2 py-3 text-center sm:px-4 sm:py-4">
                              <Checkbox
                                checked={
                                  paginatedTasks.length > 0 &&
                                  selectedPageIds.length === paginatedTasks.length
                                }
                                onChange={toggleAll}
                                aria-label="Select all tasks"
                              />
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                <HashIcon className="size-4" />
                                Task #
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Task
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Assigned To
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Delegated By
                              </div>
                            </TableHead>

                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Status
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Priority
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                <CalendarIcon className="size-4" />
                                Due Date
                              </div>
                            </TableHead>
                            <TableHead className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                              <div className="flex items-center justify-center gap-2">
                                Actions
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTasks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} className="py-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <ClipboardCheckIcon className="text-muted-foreground mb-4 size-8" />
                                  <p className="text-base font-medium">No tasks found</p>
                                  <p className="text-muted-foreground mt-1 text-sm">
                                    Try a different search term to refine the task table.
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : paginatedTasks.map((task) => (
                            <TableRow
                              key={task.taskNo}
                              className={cn(
                                "transition-colors hover:bg-emerald-50/30",
                                selectedIds.has(task.taskNo) && "bg-slate-50/50"
                              )}
                            >
                              <TableCell className="px-2 py-3 text-center sm:px-4 sm:py-4">
                                <Checkbox
                                  checked={selectedIds.has(task.taskNo)}
                                  onChange={() => toggleTask(task.taskNo)}
                                  aria-label={`Select ${task.taskNo}`}
                                />
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center font-semibold text-emerald-950 sm:px-4 sm:py-4">
                                {task.taskNo}
                              </TableCell>
                              <TableCell className="max-w-sm px-3 py-3 sm:px-4 sm:py-4">
                                <p className="font-medium">{task.task}</p>
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4">
                                {task.assignedTo}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center text-sm sm:px-4 sm:py-4">
                                {task.delegatedBy}
                              </TableCell>

                              <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4">
                                <span
                                  className={cn(
                                    "inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                                    getStatusClasses(task.status)
                                  )}
                                >
                                  {task.status}
                                </span>
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
                              <TableCell className="px-3 py-3 text-center font-medium text-emerald-800 sm:px-4 sm:py-4">
                                {task.dueDate}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center sm:px-4 sm:py-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-emerald-100">
                                      <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleViewTask(task)}>
                                      <EyeIcon className="mr-2 h-4 w-4" />
                                      View
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

                    {/* Mobile/Tablet Card View */}
                    <div className="grid grid-cols-1 gap-4 lg:hidden">
                      {paginatedTasks.map((task) => (
                        <TaskCard 
                          key={task.taskNo} 
                          task={task} 
                          getStatusClasses={getStatusClasses}
                          getPriorityClasses={getPriorityClasses}
                        />
                      ))}
                    </div>

                    <DataTablePagination
                      page={page}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(1)
                      }}
                      pageSizeOptions={pageSizeOptions}
                      startIndex={startIndex}
                      total={total}
                    />
                  </>
                ) : (
                  <TaskKanbanView
                    tasks={filteredTasks.filter((t: Task) =>
                      (filterStatus === 'All' || t.status === filterStatus) &&
                      (t.task.toLowerCase().includes(searchQuery.toLowerCase()) || t.taskNo.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    onTaskClick={handleViewTask}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <TaskViewModal 
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        task={viewingTask}
        isTeamTask={isTeamTask}
      />
    </section>
  )
}
