"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { workspaceApi } from "@/lib/api"

interface Shift {
  id: string
  title: string
  startTime: string
  endTime: string
  organizationId?: string
  description?: string
  shiftType?: string
}

export function ShiftManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    startTime: "09:00",
    startAmPm: "AM",
    endTime: "05:00",
    endAmPm: "PM",
    description: "",
    shiftType: "regular",
  })

  const queryClient = useQueryClient()
  const [orgId] = useState<string | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])

  // Load shifts
  const { data: shiftsData, refetch } = useQuery({
    queryKey: ["workspace-shifts"],
    queryFn: () => workspaceApi.getShifts(),
  })
  
  React.useEffect(() => {
    if (shiftsData?.success) setShifts(shiftsData.shifts || [])
  }, [shiftsData])

  const createMutation = useMutation({
    mutationFn: (data: any) => workspaceApi.createShift(data),
    onSuccess: (res) => {
      setShifts((prev) => [...prev, res.shift])
      toast.success("Shift created successfully")
      setIsDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: () => toast.error("Failed to create shift")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => workspaceApi.updateShift(id, data),
    onSuccess: (res, variables) => {
      setShifts((prev) =>
        prev.map((s) => (s.id === variables.id ? { ...s, ...res.shift } : s))
      )
      toast.success("Shift updated successfully")
      setIsDialogOpen(false)
      setEditingShift(null)
      resetForm()
      refetch()
    },
    onError: () => toast.error("Failed to update shift")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspaceApi.deleteShift(id),
    onSuccess: (_, id) => {
      setShifts((prev) => prev.filter((s) => s.id !== id))
      toast.success("Shift deleted successfully")
      refetch()
    },
    onError: () => toast.error("Failed to delete shift")
  })

  const resetForm = () => {
    setFormData({
      title: "",
      startTime: "09:00",
      startAmPm: "AM",
      endTime: "05:00",
      endAmPm: "PM",
      description: "",
      shiftType: "regular",
    })
  }

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift)
    const [startT, startA] = (shift.startTime || "09:00 AM").split(" ")
    const [endT, endA] = (shift.endTime || "05:00 PM").split(" ")
    setFormData({
      title: shift.title,
      startTime: startT || "09:00",
      startAmPm: startA || "AM",
      endTime: endT || "05:00",
      endAmPm: endA || "PM",
      description: shift.description || "",
      shiftType: shift.shiftType || "regular",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all fields")
      return
    }

    const payload = {
      title: formData.title,
      startTime: `${formData.startTime} ${formData.startAmPm}`,
      endTime: `${formData.endTime} ${formData.endAmPm}`,
      description: formData.description,
      shiftType: formData.shiftType,
      organizationId: orgId || undefined,
    }

    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Shift Management</CardTitle>
          <CardDescription>Configure working shifts and their timings.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingShift(null) }}>
              <Plus className="size-4 mr-2" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] w-auto overflow-visible">
            <DialogHeader>
              <DialogTitle>{editingShift ? "Edit Shift" : "Create Shift"}</DialogTitle>
              <DialogDescription>
                Define the title and time range for this shift.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Shift Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Morning Shift"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="startTime"
                      type="text"
                      placeholder="HH:MM"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                    <select
                      value={formData.startAmPm}
                      onChange={(e) => setFormData({ ...formData, startAmPm: e.target.value })}
                      className="w-[80px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="flex gap-2">
                    <Input
                      id="endTime"
                      type="text"
                      placeholder="HH:MM"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                    <select
                      value={formData.endAmPm}
                      onChange={(e) => setFormData({ ...formData, endAmPm: e.target.value })}
                      className="w-[80px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Standard operational hours"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label>Shift Type</Label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="regular">Regular</option>
                    <option value="flexible">Flexible</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingShift ? "Update Shift" : "Create Shift"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {shifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shifts configured yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Title</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift: Shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.title}</TableCell>
                  <TableCell>{shift.startTime}</TableCell>
                  <TableCell>{shift.endTime}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)}>
                        <Edit2 className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(shift.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
