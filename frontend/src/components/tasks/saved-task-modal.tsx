"use client"

import { BasicModal } from "@/components/smoothui/basic-modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, User, Calendar as CalendarIcon, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SavedTask } from "@/lib/data/saved-tasks-data"

interface SavedTaskModalProps {
  open: boolean
  onClose: () => void
  task: SavedTask | null
}

export function SavedTaskModal({ open, onClose, task }: SavedTaskModalProps) {
  if (!task) return null

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low': return 'bg-primary/5 text-primary border-emerald-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <BasicModal
      isOpen={open}
      onClose={onClose}
      size="xl"
      title={`Saved Task: ${task.id}`}
      className="p-0 overflow-hidden max-w-2xl"
    >
      <div className="flex flex-col bg-background">
        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{task.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", getPriorityColor(task.priority))}>
                    {task.priority} Priority
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                    {task.templateCategory}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-primary/[0.02] border border-primary/5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Assignment Type
              </Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {task.assignedType === 'team' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold capitalize">{task.assignedType}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{task.taskType.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Est. Time
              </Label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{task.estimatedTime}</p>
                  <p className="text-[11px] text-muted-foreground">Expected duration</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Description</Label>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex flex-col sm:flex-row sm:items-center justify-between bg-background/50 gap-4">
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>Saved on {task.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-semibold">Cancel</Button>
            <Button size="sm" className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> Use Template
            </Button>
          </div>
        </div>
      </div>
    </BasicModal>
  )
}
