"use client"

import * as React from "react"
import { PlusIcon, CheckIcon, Building2Icon, UserCogIcon, UsersIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { branchService } from "@/lib/services/branch-service"
import { employeeService, type UIEmployee } from "@/lib/services/employee-service"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AddTeamDialog() {
  const [open, setOpen] = React.useState(false)
  const [role, setRole] = React.useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")
  const [selectedMembers, setSelectedMembers] = React.useState<Set<string>>(new Set())

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAllBranches(),
    enabled: open,
  })

  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff-by-branch", selectedBranchId],
    queryFn: () => employeeService.getAllEmployees(),
    enabled: !!selectedBranchId,
  })

  const toggleMember = (memberId: string) => {
    const next = new Set(selectedMembers)
    if (next.has(memberId)) {
      next.delete(memberId)
    } else {
      next.add(memberId)
    }
    setSelectedMembers(next)
  }

  const handleReset = () => {
    setRole("")
    setSelectedBranchId("")
    setSelectedMembers(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) handleReset()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/80 ">
          <PlusIcon className="mr-2 size-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UsersIcon className="size-5 text-slate-600" />
            Create New Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Team Role</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "PM", label: "Project Manager", icon: UserCogIcon },
                { id: "TH", label: "Team Head", icon: Building2Icon },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                    role === r.id 
                      ? "border-emerald-600 bg-slate-50 text-slate-700 " 
                      : "border-primary/20 hover:border-slate-200 hover:bg-slate-50/50 text-slate-500"
                  )}
                >
                  <r.icon className={cn("size-6", role === r.id ? "text-slate-600" : "text-slate-400")} />
                  <span className="text-xs font-bold">{r.label}</span>
                  {role === r.id && <div className="absolute top-2 right-2"><CheckIcon className="size-3 text-slate-600" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Conditional Branch Selection */}
          {role && (
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Select Branch</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue placeholder="Choose a branch..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 3: Member Selection */}
          {selectedBranchId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-700">Select Team Members</Label>
                <Badge variant="secondary" className="bg-primary/10 text-slate-700 border-slate-200">
                  {selectedMembers.size} selected
                </Badge>
              </div>
              
              <ScrollArea className="h-[200px] rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                {isLoadingStaff ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading branch staff...</span>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <span className="text-xs text-muted-foreground italic">No staff members in this branch.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedMembers.has(member.id) ? "bg-emerald-50" : "hover:bg-primary/10/80"
                        )}
                        onClick={() => toggleMember(member.id)}
                      >
                        <Checkbox 
                          checked={selectedMembers.has(member.id)} 
                          onChange={() => toggleMember(member.id)}
                          className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-emerald-600"
                        />
                        <Avatar className="size-8 border ">
                          <AvatarFallback className="bg-slate-50 text-slate-700 font-bold text-[10px]">
                            {member.firstName?.[0] ?? ""}{member.lastName?.[0] ?? ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] font-bold text-slate-900 truncate">{member.firstName} {member.lastName}</span>
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{member.designation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500 font-bold">Cancel</Button>
          <Button 
            disabled={!role || !selectedBranchId || selectedMembers.size === 0}
            className="bg-primary hover:bg-primary/80  font-bold px-8"
            onClick={() => {
              // Implementation for saving would go here
              // Saving Team
              setOpen(false)
            }}
          >
            Create Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
