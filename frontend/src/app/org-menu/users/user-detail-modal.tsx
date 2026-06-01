"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MailIcon, PhoneIcon, Building2Icon, BriefcaseIcon, X, Save } from "lucide-react"
import { staffService } from "@/lib/services/staff-service"
import { toast } from "sonner"

interface UserDetailModalProps {
  user: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  initialEditMode?: boolean
  onSave?: () => void
}

export function UserDetailModal({ user, open, onOpenChange, title, initialEditMode = false, onSave }: UserDetailModalProps) {
  const [isEditing, setIsEditing] = React.useState(initialEditMode)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    firstName: "", lastName: "", email: "", designation: "",
    department: "", mobile: "", status: "", employmentType: "",
    category: "",
  })

  React.useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        designation: user.designation || "",
        department: user.department || "",
        mobile: user.mobile || "",
        status: user.status || "",
        employmentType: user.employmentType || "",
        category: user.category || "",
      })
      setIsEditing(initialEditMode)
    }
  }, [user, initialEditMode])

  if (!user) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await staffService.updateStaff(user.id, form)
      toast.success("User updated successfully")
      setIsEditing(false)
      onSave?.()
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-xl">
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle>{title ?? `${user.firstName} ${user.lastName}`}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-1">
                  <span>{user.empId}</span>
                  <span>·</span>
                  <span>{user.designation}</span>
                  <span>·</span>
                  <span>{user.department}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                    <X className="mr-1.5 size-3.5" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80">
                    <Save className="mr-1.5 size-3.5" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building2Icon className="size-4 text-slate-500" /> First Name
              </Label>
              {isEditing ? (
                <Input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building2Icon className="size-4 text-slate-500" /> Last Name
              </Label>
              {isEditing ? (
                <Input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.lastName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MailIcon className="size-4 text-slate-500" /> Email
              </Label>
              {isEditing ? (
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <PhoneIcon className="size-4 text-slate-500" /> Phone
              </Label>
              {isEditing ? (
                <Input value={form.mobile} onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.mobile}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <BriefcaseIcon className="size-4 text-slate-500" /> Designation
              </Label>
              {isEditing ? (
                <Input value={form.designation} onChange={(e) => setForm(f => ({ ...f, designation: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.designation}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building2Icon className="size-4 text-slate-500" /> Department
              </Label>
              {isEditing ? (
                <Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.department}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <BriefcaseIcon className="size-4 text-slate-500" /> Category
              </Label>
              {isEditing ? (
                <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              {isEditing ? (
                <select
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">{user.status}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Employment Type</Label>
              {isEditing ? (
                <Input value={form.employmentType} onChange={(e) => setForm(f => ({ ...f, employmentType: e.target.value }))} />
              ) : (
                <p className="text-sm text-muted-foreground">{user.employmentType}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Joining Date</Label>
              <p className="text-sm text-muted-foreground">{user.joiningDate}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Experience</Label>
              <p className="text-sm text-muted-foreground">{user.totalExperience}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
