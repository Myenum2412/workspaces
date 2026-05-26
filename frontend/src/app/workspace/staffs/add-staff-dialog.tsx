"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddStaffForm } from "./add-staff-form"

interface AddStaffDialogProps {
  onStaffAdded?: (staff: any) => void
}

export function AddStaffDialog({ onStaffAdded }: AddStaffDialogProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <PlusIcon className="mr-2 size-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new staff member. All information is stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden flex flex-col">
          <AddStaffForm
            onCancel={() => setOpen(false)}
            onStaffAdded={(staff) => {
              if (onStaffAdded) onStaffAdded(staff)
              setOpen(false)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
