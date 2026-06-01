"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  Building2,
  Clock,
  Monitor,
  SaveIcon,
  XIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { staffService, type UIStaff } from "@/lib/services/staff-service"

import { DeleteUserDialog } from "../delete-user-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function getStatusColor(status: string | null | undefined) {
  switch (status) {
    case "Active": return "bg-primary"
    case "Inactive": return "bg-slate-400"
    case "On Leave": return "bg-amber-500"
    case "Deleted": return "bg-red-500"
    default: return "bg-slate-400"
  }
}

function ProfileField({ label, value, field, isEditing, onChange, type = "text" }: {
  label: string
  value?: string | null
  field: string
  isEditing: boolean
  onChange: (field: string, value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      {isEditing ? (
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
          className="h-8 text-sm"
        />
      ) : (
        <p className="text-sm font-semibold">{value}</p>
      )}
    </div>
  )
}

export default function StaffProfilePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = params.id as string

  const [isEditing, setIsEditing] = React.useState(false)
  const [editedUser, setEditedUser] = React.useState<UIStaff | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => staffService.getAllStaff(),
  })

  const user = React.useMemo(() => users.find((u) => u.id === userId), [users, userId])

  React.useEffect(() => {
    if (user) {
      setEditedUser({ ...user })
    }
  }, [user])

  const handleChange = (field: string, value: string | null) => {
    setEditedUser((prev) => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!editedUser) return
    try {
      await staffService.updateStaff(userId, editedUser as Record<string, any>)
      toast.success("Profile updated successfully")
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["users-all"] })
    } catch {
      toast.error("Failed to update profile")
    }
  }

  const handleCancel = () => {
    if (user) setEditedUser({ ...user })
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  if (!user || !editedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground font-medium">User not found</p>
        <Button variant="outline" onClick={() => router.push("/org-menu/users")}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push("/org-menu/users")}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to Users
        </Button>
        <div className="flex items-center gap-2">
          <DeleteUserDialog userId={user?.id ?? ""} userName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()} onDeleted={() => router.push("/org-menu/users")} />
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <XIcon className="mr-2 size-4" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/80">
                <SaveIcon className="mr-2 size-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/80">
              <PencilIcon className="mr-2 size-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <Card className="overflow-hidden border-primary/10">
        <div className="h-32 bg-emerald-600" />
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <Avatar className="size-24 border-4 border-white shadow-lg">
              {user.avatar ? <AvatarImage src={user.avatar} /> : null}
              <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                {user.firstName?.[0] ?? ""}{user.lastName?.[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input className="h-9 text-xl font-bold w-36" value={editedUser.firstName ?? ""} onChange={(e) => handleChange("firstName", e.target.value)} />
                    <Input className="h-9 text-xl font-bold w-36" value={editedUser.lastName ?? ""} onChange={(e) => handleChange("lastName", e.target.value)} />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold tracking-tight">
                    {editedUser.firstName} {editedUser.lastName}
                  </h1>
                )}
                <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                  {user.empId}
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                  <div className={cn("h-2 w-2 rounded-full", getStatusColor(editedUser.status))} />
                  <span className="text-xs font-bold uppercase tracking-wider">{editedUser.status}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">@{user.nickname}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BriefcaseIcon className="size-4 text-primary" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ProfileField label="Designation" value={editedUser.designation} field="designation" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Department" value={editedUser.department} field="department" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Employment Type" value={editedUser.employmentType} field="employmentType" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Source of Hire" value={editedUser.sourceOfHire} field="sourceOfHire" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Current Experience" value={editedUser.currentExperience} field="currentExperience" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Total Experience" value={editedUser.totalExperience} field="totalExperience" isEditing={isEditing} onChange={handleChange} />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MailIcon className="size-4 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ProfileField label="Work Email" value={editedUser.email} field="email" isEditing={isEditing} onChange={handleChange} type="email" />
              <ProfileField label="Work Phone" value={editedUser.mobile} field="mobile" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Personal Email" value={editedUser.personalEmail} field="personalEmail" isEditing={isEditing} onChange={handleChange} type="email" />
              <ProfileField label="Personal Phone" value={editedUser.personalPhone} field="personalPhone" isEditing={isEditing} onChange={handleChange} />
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPinIcon className="size-4 text-primary" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Present Address</p>
                {isEditing ? (
                  <Textarea value={editedUser.presentAddress ?? ""} onChange={(e) => handleChange("presentAddress", e.target.value)} className="text-sm min-h-[80px]" />
                ) : (
                  <p className="text-sm font-semibold">{editedUser.presentAddress}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Permanent Address</p>
                {isEditing ? (
                  <Textarea value={editedUser.permanentAddress ?? ""} onChange={(e) => handleChange("permanentAddress", e.target.value)} className="text-sm min-h-[80px]" />
                ) : (
                  <p className="text-sm font-semibold">{editedUser.permanentAddress}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="size-4 text-primary" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ProfileField label="Date of Birth" value={editedUser.dob} field="dob" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Gender" value={editedUser.gender} field="gender" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Marital Status" value={editedUser.maritalStatus} field="maritalStatus" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Joining Date" value={user.joiningDate} field="joiningDate" isEditing={false} onChange={handleChange} />
            </CardContent>
          </Card>

          {/* Government IDs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Government IDs
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ProfileField label="PAN" value={editedUser.pan} field="pan" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="Aadhaar" value={editedUser.aadhaar} field="aadhaar" isEditing={isEditing} onChange={handleChange} />
              <ProfileField label="UAN" value={editedUser.uan} field="uan" isEditing={isEditing} onChange={handleChange} />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Bio / Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={editedUser.bio ?? ""} onChange={(e) => handleChange("bio", e.target.value)} className="text-sm min-h-[120px]" placeholder="Add bio or notes..." />
              ) : (
                <p className="text-sm text-muted-foreground">{editedUser.bio || "No bio added."}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-primary" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Hours</p>
                  <p className="text-sm font-bold">{user.activeHours}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Monitor className="size-4 text-blue-600" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Screen Time</p>
                  <p className="text-sm font-bold">{user.screenTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              {user.expertise && user.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.expertise.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No expertise listed.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${user.email}`}>
                  <MailIcon className="mr-2 size-4" />
                  Send Email
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`tel:${user.mobile}`}>
                  <PhoneIcon className="mr-2 size-4" />
                  Call User
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
