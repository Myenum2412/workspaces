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
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface Shift {
  id: string
  title: string
  startTime: string
  endTime: string
  organizationId?: string
}

export function ShiftManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    startTime: "09:00",
    endTime: "17:00",
  })

  const queryClient = useQueryClient()
  const [orgId] = useState<string | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])

  const createMutation = {
    mutate: (data: any) => {
      const newShift: Shift = {
        id: crypto.randomUUID(),
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        organizationId: orgId || undefined,
      }
      setShifts((prev) => [...prev, newShift])
      toast.success("Shift created successfully")
      setIsDialogOpen(false)
      resetForm()
    },
    isPending: false,
  }

  const updateMutation = {
    mutate: ({ id, data }: { id: string; data: any }) => {
      setShifts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s))
      )
      toast.success("Shift updated successfully")
      setIsDialogOpen(false)
      setEditingShift(null)
      resetForm()
    },
    isPending: false,
  }

  const deleteMutation = {
    mutate: (id: string) => {
      setShifts((prev) => prev.filter((s) => s.id !== id))
      toast.success("Shift deleted successfully")
    },
    isPending: false,
  }

  const resetForm = () => {
    setFormData({
      title: "",
      startTime: "09:00",
      endTime: "17:00",
    })
  }

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift)
    setFormData({
      title: shift.title,
      startTime: shift.startTime,
      endTime: shift.endTime,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all fields")
      return
    }

    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, data: formData })
    } else {
      createMutation.mutate({ ...formData, branchId: null, organizationId: orgId })
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
          <DialogContent>
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
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
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
