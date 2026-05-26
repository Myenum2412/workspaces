"use client"

import React, { useState, useCallback } from 'react'

import { Task } from '@/lib/data/table-data'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon, CheckSquare, Bookmark, Plus, MoreHorizontal, Check, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface TaskKanbanViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  // Optional callback when status changes with reason and approver
  onStatusChange?: (task: Task, newStatus: string, reason?: string, approver?: string) => void
}

const statusColumns = ["Open", "Hold", "Closed", "Recurring", "Paused"]

export function TaskKanbanView({ tasks, onTaskClick, onStatusChange }: TaskKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.setData('text/plain', task.taskNo)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask) return

    if (draggedTask.status === targetStatus) {
      setDraggedTask(null)
      return
    }

    if (onStatusChange) {
      onStatusChange(draggedTask, targetStatus)
    }

    setDraggedTask(null)
  }, [draggedTask, onStatusChange])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }, [])

  return (
    <div className="flex gap-4 h-full min-h-[500px] overflow-x-auto pb-4">
      {statusColumns.map((status) => {
        const columnTasks = tasks.filter(t => t.status === status)
        const isDragOver = dragOverColumn === status

        return (
          <div
            key={status}
            className="flex flex-col min-w-[280px] w-[280px] shrink-0 h-full"
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs uppercase text-muted-foreground tracking-wide">
                  {status}
                </h3>
                {status !== "Closed" && status !== "Recurring" && status !== "Paused" && (
                  <span className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                    {columnTasks.length}
                  </span>
                )}
                {status === "Closed" && (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
            </div>

            <div
              className={cn(
                "flex-1 min-h-0 flex flex-col gap-3 rounded-xl transition-all duration-200 bg-slate-50/50 p-2 border border-transparent",
                isDragOver && "bg-slate-100 border-slate-200"
              )}
            >
              <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col gap-2.5 pb-2">
                  {columnTasks.map((task) => {
                       // Highlight logic based on image
                       const isHighlighted = task.status === "Hold" && task.taskNo === "T-004";
                       
                       return (
                      <div
                        key={task.taskNo}
                        onClick={() => onTaskClick(task)}
                        className="group"
                      >
                        <Card
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "border border-border/60 bg-background hover:border-border transition-all cursor-grab active:cursor-grabbing shadow-sm rounded-lg",
                            draggedTask?.taskNo === task.taskNo && "opacity-50 shadow-md",
                            isHighlighted && "bg-[#eef4ff] border-blue-200" 
                          )}
                        >
                          <CardContent className="p-3.5 flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                              <h4 className="text-[13px] font-medium text-foreground leading-snug">
                                {task.task}
                              </h4>
                              {task.status === "Hold" && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:bg-transparent">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex items-center">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/60 text-muted-foreground bg-background w-fit">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-medium">{task.dueDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                {task.status === "Hold" ? (
                                  <Bookmark className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <CheckSquare className="h-4 w-4 text-white fill-blue-500" />
                                )}
                                <span className="text-[11px] font-medium">{task.taskNo}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {task.status === "Hold" && task.taskNo !== "T-004" && (
                                   <div className="text-muted-foreground">
                                     <Workflow className="h-3.5 w-3.5" />
                                   </div>
                                )}
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                                    {task.assignedTo.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )})}
                  
                  {status === "Open" && (
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-muted/50 mt-1 h-8 px-2" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )
      })}
      
      {/* The add column button from the image */}
      <div className="flex flex-col min-w-[40px] shrink-0 h-full">
         <Button variant="outline" size="icon" className="h-8 w-8 rounded text-muted-foreground bg-background shadow-sm">
            <Plus className="h-4 w-4" />
         </Button>
      </div>
    </div>
  )
}

