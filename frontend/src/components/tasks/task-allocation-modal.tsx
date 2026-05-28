"use client"

import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Loader2,
  ListTodo,
  ChevronDownIcon,
  Bookmark,
  CalendarIcon
} from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { BasicModal } from "@/components/smoothui/basic-modal"

import {
  PrioritySelector,
  AssigneeSelector,
} from "@/components/task-allocation/components"
const priorities = [
  { id: "p1", name: "low" },
  { id: "p2", name: "medium" },
  { id: "p3", name: "high" },
  { id: "p4", name: "urgent" },
]
import type { AssigneeType } from "@/components/task-allocation/types"
import TableUpload from "@/components/table-upload"

import { taskService, type UITask } from "@/lib/services/task-service"
import { staffService } from "@/lib/services/staff-service"
import { teamService } from "@/lib/services/team-service"

interface TaskDefinition {
  id: string
  name: string
  description?: string
  isActive: boolean
}

interface TeamOption {
  id: string
  name: string
  created_by: string
  memberCount: number
}

interface TaskAllocationModalProps {
  open: boolean
  onClose: () => void
  taskDefinitions?: TaskDefinition[]
  onSaveTemplate?: (data: { name: string; description: string; isActive: boolean }) => Promise<{ success: boolean; error?: string }>
}

export function TaskAllocationModal({ open, onClose, taskDefinitions = [], onSaveTemplate }: TaskAllocationModalProps) {
  const queryClient = useQueryClient()

  const [allocationMode, setAllocationMode] = useState<"individual" | "team">("individual")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [selectedAssigneeType, setSelectedAssigneeType] = useState<AssigneeType | null>(null)
  const [isRepeatedTask, setIsRepeatedTask] = useState(false)
  const [repeatFrequency, setRepeatFrequency] = useState<string | null>(null)
  const [customRepeatIntervalDays, setCustomRepeatIntervalDays] = useState<number | "">("")
  const [repeatStartDate, setRepeatStartDate] = useState<Date | undefined>(undefined)
  const [repeatStartDateOpen, setRepeatStartDateOpen] = useState(false)
  const [repeatDays, setRepeatDays] = useState<{ key: string; label: string; enabled: boolean }[]>([
    { key: "monday", label: "Mon", enabled: true },
    { key: "tuesday", label: "Tue", enabled: true },
    { key: "wednesday", label: "Wed", enabled: true },
    { key: "thursday", label: "Thu", enabled: true },
    { key: "friday", label: "Fri", enabled: true },
    { key: "saturday", label: "Sat", enabled: false },
    { key: "sunday", label: "Sun", enabled: false },
  ])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState<{ type: 'staff' | 'team' | 'priority', open: boolean }>({ type: 'staff', open: false })

  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string }>>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load data when modal opens
  useState(() => {
    if (open) {
      setIsLoadingData(true)
      Promise.all([staffService.getAllStaff(), teamService.getAllTeams()]).then(([staff, teams]) => {
        setEmployees(staff.map(s => ({ id: s.id, name: `${s.firstName} ${s.lastName}`.trim(), role: s.designation })))
        setTeams(teams.map(t => ({ id: t.id, name: t.name, created_by: t.head, memberCount: t.members })))
        setIsLoadingData(false)
      })
    }
  })

  useEffect(() => {
    const stored = localStorage.getItem("repeated-task-days")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRepeatDays((prev) => prev.map((d) => {
          const found = parsed.find((p: any) => p.key === d.key)
          return found ? { ...d, enabled: found.enabled } : d
        }))
      } catch { /* ignore */ }
    }
  }, [])

  const resetForm = () => {
    setTitle(""); setDescription(""); setPriority("")
    setDueDate(undefined); setSelectedStaff([]); setSelectedTeams([])
    setSelectedAssignee(null); setSelectedAssigneeType(null)
    setIsRepeatedTask(false); setRepeatFrequency(null)
    setCustomRepeatIntervalDays(""); setRepeatStartDate(undefined); setUploadedFiles([])
    setAllocationMode("individual"); setSaveAsTemplate(false)
  }

  const handleClose = () => { resetForm(); onClose() }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !priority) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      if (saveAsTemplate && onSaveTemplate) {
        await onSaveTemplate({ name: title.trim(), description: description.trim(), isActive: true })
      }

      const newTask = await taskService.createTask({
        task: title.trim(),
        description: description.trim(),
        priority,
        status: "Open",
        assignedTo: selectedAssigneeType === "staff"
          ? employees.find(e => e.id === selectedAssignee)?.name || "Unassigned"
          : teams.find(t => t.id === selectedAssignee)?.name || "Unassigned",
        delegatedBy: "Admin",


        dueDate: dueDate?.toISOString(),

        finalStatus: "Open",
      } as Partial<UITask>)

      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success(`Task "${title}" assigned successfully`)
      handleClose()
    } catch (err) {
      toast.error("An error occurred while creating the task")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <BasicModal
      isOpen={open}
      onClose={handleClose}
      size="xl"
      title="Allocate Tasks to Staffs / Teams"
      className="p-2 sm:p-4"
    >
      <div className="max-h-[min(85vh,700px)] overflow-y-auto px-5 pb-5 pt-1 text-foreground">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">

          {/* 1. Quick Fill */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex-1">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 ",
                    saveAsTemplate
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-500/10"
                      : "text-muted-foreground hover:bg-muted border border-transparent"
                  )}
                >
                  <Bookmark className={cn("h-5 w-5", saveAsTemplate && "fill-current")} />
                  {saveAsTemplate && (
                    <span className="text-[11px] font-extrabold uppercase tracking-tight">Saved Task</span>
                  )}
                </button>
              </div>
            </div>
            {taskDefinitions.length > 0 && (
              <div className="w-full sm:w-64 space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                  <ListTodo className="h-3 w-3" /> Select Saved Task
                </Label>
                <Select onValueChange={(val) => {
                  const selected = taskDefinitions.find(d => d.id === val)
                  if (selected) { setTitle(selected.name); setDescription(selected.description || "") }
                }}>
                  <SelectTrigger className="h-9 bg-primary/5 border-primary/20">
                    <SelectValue placeholder="Quick fill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {taskDefinitions.filter(d => d.isActive).map(def => (
                      <SelectItem key={def.id} value={def.id}>{def.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 2. Title & Repeat Settings */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Task Title *</Label>
              <Input placeholder="Enter task title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-9 bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Repeated Settings</Label>
              <Select value={isRepeatedTask ? repeatFrequency || "" : "no"} onValueChange={(v) => { setIsRepeatedTask(v !== "no"); setRepeatFrequency(v === "no" ? null : v) }}>
                <SelectTrigger className="h-9 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No Repeat</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2b. Repeat Date (shown when repeat is on) */}
          {isRepeatedTask && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Start Date</Label>
              <Popover open={repeatStartDateOpen} onOpenChange={setRepeatStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 bg-background/50 text-foreground">
                    {repeatStartDate ? repeatStartDate.toLocaleDateString() : "Select start date"}
                    <CalendarIcon className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border"><Calendar mode="single" selected={repeatStartDate} onSelect={(d) => { setRepeatStartDate(d); setRepeatStartDateOpen(false) }} /></PopoverContent>
              </Popover>
            </div>
          )}

          {/* 3. Priority, Assignment & Due Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Priority *</Label>
              <PrioritySelector
                selectedPriority={priority}
                priorities={priorities}
                onSelect={(val) => {
                  if (val === 'quick-add') {
                    setQuickAddOpen({ type: 'priority', open: true })
                  } else {
                    setPriority(val)
                  }
                }}
              />
            </div>
            <AssigneeSelector
              selectedAssignee={selectedAssignee}
              selectedAssigneeType={selectedAssigneeType}
              employees={employees}
              teams={teams}
              onSelect={(id, type) => {
                setSelectedAssignee(id)
                setSelectedAssigneeType(type)
                if (type === 'staff') {
                  setSelectedStaff([id])
                  setSelectedTeams([])
                } else {
                  setSelectedTeams([id])
                  setSelectedStaff([])
                }
              }}
              onRemove={() => {
                setSelectedAssignee(null)
                setSelectedAssigneeType(null)
                setSelectedStaff([])
                setSelectedTeams([])
              }}
            />
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Due Date</Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 bg-background/50 text-foreground">
                    {dueDate ? dueDate.toLocaleDateString() : "Select date"}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border "><Calendar mode="single" selected={dueDate} onSelect={(d) => { setDueDate(d); setDueDateOpen(false) }} /></PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Description *</Label>
            </div>
            <Textarea placeholder="Describe the task..." value={description} onChange={(e) => setDescription(e.target.value)} required className="min-h-[60px] bg-background/50" />
          </div>

          {/* 5. File Upload */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase text-muted-foreground/80">Upload Table (optional)</Label>
            <TableUpload onFilesChange={setUploadedFiles} compactImage={true} />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-background/80">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="px-8 font-bold">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assigning...</> : (selectedAssigneeType === "staff" ? "Assign to Staff" : "Assign to Team")}
            </Button>
          </div>
        </form>
      </div>
    </BasicModal>

    {/* Quick Add Modal */}
    <BasicModal
      isOpen={quickAddOpen.open}
      onClose={() => setQuickAddOpen({ ...quickAddOpen, open: false })}
      title={
        quickAddOpen.type === 'staff' ? "Quick Add Staff" :
        quickAddOpen.type === 'team' ? "Quick Add Team" :
        "Quick Add Priority"
      }
      size="md"
      className="z-[100]"
    >
      <div className="p-6 space-y-4">
        {quickAddOpen.type === 'staff' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input placeholder="Enter first name" />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input placeholder="Enter last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input placeholder="Enter email address" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue="Staff">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : quickAddOpen.type === 'team' ? (
          <>
            <div className="space-y-1.5">
              <Label>Team Name</Label>
              <Input placeholder="Enter team name" />
            </div>
            <div className="space-y-1.5">
              <Label>Team Leader</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select leader" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Team purpose..." className="min-h-[80px]" />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Priority Level Name</Label>
              <Input placeholder="e.g., Extreme, Urgent, Soon" />
            </div>
            <div className="space-y-1.5">
              <Label>Color Code</Label>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500 cursor-pointer border-2 border-transparent hover:border-foreground" />
                <div className="w-8 h-8 rounded-full bg-orange-500 cursor-pointer border-2 border-transparent hover:border-foreground" />
                <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer border-2 border-transparent hover:border-foreground" />
                <div className="w-8 h-8 rounded-full bg-slate-500 cursor-pointer border-2 border-transparent hover:border-foreground" />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setQuickAddOpen({ ...quickAddOpen, open: false })}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
            toast.success(`${quickAddOpen.type === 'staff' ? 'Staff member' : 'Team'} added successfully`)
            setQuickAddOpen({ ...quickAddOpen, open: false })
          }}>
            Quick Add
          </Button>
        </div>
      </div>
    </BasicModal>
    </>
  )
}
