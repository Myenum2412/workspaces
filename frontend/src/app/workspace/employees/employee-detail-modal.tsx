"use client"

import * as React from "react"
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  MoreVertical,
  History,
  UserIcon,
  FileText,
  Building2,
  Clock,
} from "lucide-react"
import { employeeService } from "@/lib/services/employee-service"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface EmployeeDetailModalProps {
  employee: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (updatedEmployee: any) => void
  initialEditMode?: boolean
}

export function EmployeeDetailModal({ employee, open, onOpenChange, onSave, initialEditMode = false }: EmployeeDetailModalProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedEmployee, setEditedEmployee] = React.useState<any>(employee || {})

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (employee) setEditedEmployee({ ...employee })
      if (open) setIsEditing(initialEditMode)
      else setIsEditing(false)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [employee, open, initialEditMode])

  if (!employee) return null

  const handleSave = async () => {
    try {
      // Map UI fields back to service fields
      const updateData: Record<string, any> = {
        firstName: editedEmployee.firstName,
        lastName: editedEmployee.lastName,
        email: editedEmployee.email,
        roleName: editedEmployee.designation,
        department: editedEmployee.department,
        phone: editedEmployee.mobile,
        status: editedEmployee.status,
        employmentType: editedEmployee.employmentType,
        currentExperience: editedEmployee.currentExperience,
        totalExperience: editedEmployee.totalExperience,
        sourceOfHire: editedEmployee.sourceOfHire,
        bio: editedEmployee.bio,
        presentAddress: editedEmployee.presentAddress,
        permanentAddress: editedEmployee.permanentAddress,
        dob: editedEmployee.dob,
        gender: editedEmployee.gender,
        maritalStatus: editedEmployee.maritalStatus,
        category: editedEmployee.category,
        pan: editedEmployee.pan,
        aadhaar: editedEmployee.aadhaar,
        uan: editedEmployee.uan,
        personalPhone: editedEmployee.personalPhone,
        personalEmail: editedEmployee.personalEmail,
      }

      await employeeService.updateEmployee(employee.id, updateData)
      toast.success("Employee profile updated successfully")
      setIsEditing(false)
      if (onSave) onSave({ ...editedEmployee })
    } catch {
      toast.error("Failed to update employee profile")
    }
  }

  const handleChange = (field: string, value: string) => {
    setEditedEmployee((prev: any) => ({ ...prev, [field]: value }))
  }

  const uploadedFiles = [
    ...(Array.isArray(editedEmployee.uploadedFiles) ? editedEmployee.uploadedFiles : []),
    ...(Array.isArray(editedEmployee.files) ? editedEmployee.files : []),
    ...(Array.isArray(editedEmployee.documents) ? editedEmployee.documents : []),
    ...(Array.isArray(editedEmployee.attachments) ? editedEmployee.attachments : []),
  ].filter(Boolean)

  const historyFields = [
    "Work experience",
    "Education details",
    "Dependent details",
    "Performance notes",
    "Verification status",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col overflow-hidden border-none bg-background ">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full border-b bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="font-heading text-2xl font-bold text-primary">Employee Profile</DialogTitle>
              <DialogDescription className="text-primary/60 font-medium">
                Detailed professional record for {employee.firstName} {employee.lastName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row bg-background">
          {/* Left Section: Employee Info */}
          <div className="flex-1 overflow-y-auto p-8 border-r border-border/50">
            <div className="space-y-10">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="size-24 border-4 border-primary/20 ">
                    <AvatarImage src={employee.avatar} />
                    <AvatarFallback className="bg-muted text-foreground text-2xl font-bold">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <div className="flex gap-2 mb-1">
                      {isEditing ? (
                        <>
                          <Input className="h-8 text-lg font-bold w-32" value={editedEmployee.firstName || ""} onChange={(e) => handleChange("firstName", e.target.value)} />
                          <Input className="h-8 text-lg font-bold w-32" value={editedEmployee.lastName || ""} onChange={(e) => handleChange("lastName", e.target.value)} />
                        </>
                      ) : (
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                          {editedEmployee.firstName} {editedEmployee.lastName}
                        </h2>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold uppercase tracking-widest bg-muted text-foreground border-slate-200">
                        {employee.empId}
                      </Badge>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                        <div className={cn("h-2 w-2 rounded-full", editedEmployee.status === "Active" ? "bg-primary" : "bg-primary")} />
                        {isEditing ? (
                           <select 
                             className="bg-transparent text-xs font-bold uppercase tracking-wider outline-none cursor-pointer"
                             value={editedEmployee.status}
                             onChange={(e) => handleChange("status", e.target.value)}
                           >
                             <option value="Active">Active</option>
                             <option value="Inactive">Inactive</option>
                             <option value="On Leave">On Leave</option>
                           </select>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider">{editedEmployee.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => {
                      if (onSave) onSave({ ...editedEmployee, status: "Inactive" })
                      onOpenChange(false)
                    }}>Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Professional Snapshot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/10/50 ">
                <div className="space-y-3">
                  <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2.5">
                    <BriefcaseIcon className="h-4 w-4 text-muted-foreground" /> Professional Role
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-foreground font-bold ">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input className="h-7 text-sm font-bold" value={editedEmployee.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} />
                          <Input className="h-6 text-xs" value={editedEmployee.department || ""} onChange={(e) => handleChange("department", e.target.value)} />
                        </div>
                      ) : (
                        <>
                          <p className="text-base font-bold text-foreground">{editedEmployee.designation}</p>
                          <p className="text-sm text-muted-foreground font-medium">{editedEmployee.department}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Tenure Record
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-muted-foreground ">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-md  h-7 flex items-center">{editedEmployee.joiningDate}</p>
                          <Input className="h-6 text-xs" value={editedEmployee.employmentType || "Full Time"} onChange={(e) => handleChange("employmentType", e.target.value)} />
                        </div>
                      ) : (
                        <>
                          <p className="text-base font-bold text-foreground">{editedEmployee.joiningDate}</p>
                          <p className="text-sm text-muted-foreground font-medium">{editedEmployee.employmentType}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2.5">
                    <History className="h-4 w-4 text-muted-foreground" /> Experience
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-muted-foreground ">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{editedEmployee.currentExperience}</p>
                      <p className="text-sm text-muted-foreground font-medium">Total: {editedEmployee.totalExperience}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* About & Expertise Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">About & Expertise</Label>
                  <div className="p-4 rounded-xl border bg-secondary/5 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Bio</p>
                      {isEditing ? (
                        <Textarea className="min-h-[60px] text-xs" value={editedEmployee.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} />
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed italic">{editedEmployee.bio}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editedEmployee.expertise?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-white text-[10px] font-bold text-foreground border-primary/10">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Address Details</Label>
                <div className="p-5 rounded-2xl border border-border/50 space-y-4 bg-background ">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="size-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none mb-1">Present Address</p>
                      {isEditing ? (
                        <Textarea className="min-h-[40px] text-xs py-1 px-2" value={editedEmployee.presentAddress || ""} onChange={(e) => handleChange("presentAddress", e.target.value)} />
                      ) : (
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                          {editedEmployee.presentAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="size-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase leading-none mb-1">Permanent Address</p>
                      {isEditing ? (
                        <Textarea className="min-h-[40px] text-xs py-1 px-2" value={editedEmployee.permanentAddress || ""} onChange={(e) => handleChange("permanentAddress", e.target.value)} />
                      ) : (
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                          {editedEmployee.permanentAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-5">
                <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Contact Details</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 group hover:bg-secondary/20">
                    <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
                      <MailIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Work Email</p>
                      {isEditing ? (
                        <Input className="h-6 text-[11px]" value={editedEmployee.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
                      ) : (
                        <p className="text-[11px] font-bold text-foreground truncate">{editedEmployee.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 group hover:bg-secondary/20">
                    <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center text-muted-foreground">
                      <PhoneIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Work Phone</p>
                      {isEditing ? (
                        <Input className="h-6 text-[11px]" value={editedEmployee.mobile || ""} onChange={(e) => handleChange("mobile", e.target.value)} />
                      ) : (
                        <p className="text-[11px] font-bold text-foreground truncate">{editedEmployee.mobile}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Personal Information</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl border bg-background">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Date of Birth</p>
                    {isEditing ? (
                      <Input type="date" className="h-7 text-xs" value={editedEmployee.dob || ""} onChange={(e) => handleChange("dob", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.dob || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Gender</p>
                    {isEditing ? (
                      <select 
                        className="flex h-7 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={editedEmployee.gender || ""}
                        onChange={(e) => handleChange("gender", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.gender || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Marital Status</p>
                    {isEditing ? (
                      <select 
                        className="flex h-7 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={editedEmployee.maritalStatus || ""}
                        onChange={(e) => handleChange("maritalStatus", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.maritalStatus || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Category</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs" value={editedEmployee.category || ""} onChange={(e) => handleChange("category", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.category || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Personal Phone</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs" value={editedEmployee.personalPhone || ""} onChange={(e) => handleChange("personalPhone", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.personalPhone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Personal Email</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs" value={editedEmployee.personalEmail || ""} onChange={(e) => handleChange("personalEmail", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground">{editedEmployee.personalEmail || "—"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Government IDs */}
              <div className="space-y-4">
                <Label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Government IDs</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border bg-primary/5">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">PAN Card</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs uppercase" value={editedEmployee.pan || ""} onChange={(e) => handleChange("pan", e.target.value.toUpperCase())} />
                    ) : (
                      <p className="text-xs font-medium text-foreground uppercase tracking-wider">{editedEmployee.pan || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Aadhaar</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs tracking-widest" value={editedEmployee.aadhaar || ""} onChange={(e) => handleChange("aadhaar", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground tracking-widest">{editedEmployee.aadhaar || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">UAN (PF)</p>
                    {isEditing ? (
                      <Input className="h-7 text-xs tracking-widest" value={editedEmployee.uan || ""} onChange={(e) => handleChange("uan", e.target.value)} />
                    ) : (
                      <p className="text-xs font-medium text-foreground tracking-widest">{editedEmployee.uan || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Professional History / Sidebar */}
          <div className="w-full md:w-[420px] flex flex-col bg-secondary/10 -[inset_1px_0_0_0_rgba(0,0,0,0.05)]">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-foreground ">
                  <History className="h-5 w-5" />
                </div>
                <span className="font-bold text-base tracking-tight">Professional History</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border ">Need to fill</Badge>
            </div>

            {/* Sidebar Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                <div className="flex justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 px-3 py-1 bg-slate-50 rounded-full border border-primary/10">Uploaded Files</span>
                </div>
                
                <div className="space-y-4">
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((file: any, i: number) => {
                      const fileName = typeof file === "string" ? file : file.name || file.fileName || file.id || `File ${i + 1}`
                      const fileSize = typeof file === "object" && file.size ? `${Math.round(file.size / 1024)} KB` : "Need to fill"

                      return (
                        <div key={`${fileName}-${i}`} className="flex gap-4 rounded-2xl border bg-white p-4 ">
                          <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-sm font-bold text-foreground">{fileName}</p>
                            <p className="text-xs font-medium text-muted-foreground">Size: {fileSize}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-bold text-emerald-800">Need to fill</p>
                      <p className="mt-1 text-xs font-medium text-foreground/80">No uploaded file details found for this employee.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Remaining Details</span>
                  
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Professional & Personal Details</span>
                  
                  {/* Work Experience */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><BriefcaseIcon className="h-4 w-4" /> Work Experience</p>
                    {employee.workExperience?.length > 0 ? employee.workExperience.map((exp: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{exp.company} - {exp.title}</p>
                        <p className="text-[10px] text-muted-foreground">{exp.from} to {exp.to}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No work experience added.</p>}
                  </div>

                  {/* Education Details */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Education Details</p>
                    {employee.educationDetails?.length > 0 ? employee.educationDetails.map((edu: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{edu.institute}</p>
                        <p className="text-[10px] text-muted-foreground">{edu.degree} - {edu.specialization}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No education details added.</p>}
                  </div>

                  {/* Dependents */}
                  <div className="rounded-2xl border bg-white p-4">
                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><UserIcon className="h-4 w-4" /> Dependents</p>
                    {employee.dependentDetails?.length > 0 ? employee.dependentDetails.map((dep: any, i: number) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold">{dep.name}</p>
                        <p className="text-[10px] text-muted-foreground">{dep.relationship} • {dep.dob}</p>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">No dependents added.</p>}
                  </div>
                </div>

                </div>
              </div>
            </ScrollArea>

            {/* Sidebar Footer/Actions */}
            <div className="p-6 bg-background border-t border-border/50">
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-primary/10/50 mb-6 ">
                <div className="flex items-center gap-2.5 mb-2">
                  <CheckCircle2Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">Verification Status</span>
                </div>
                <p className="text-xs text-foreground font-medium leading-relaxed">Need to fill</p>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/80  -emerald-100 font-bold text-sm h-12 rounded-2xl">
                Generate Performance Report
              </Button>
            </div>
          </div>
        </div>

        {/* Global Footer Controls */}
        <div className="border-t p-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-6 text-[12px] text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Record created Mar 12, 2023</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-bold">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>Status: Active Employee</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)} className="px-8 rounded-2xl font-bold border-2 hover:bg-emerald-50">Close Profile</Button>
            {isEditing ? (
              <Button size="lg" onClick={handleSave} className="px-8 rounded-2xl font-bold bg-primary hover:bg-primary/80  -emerald-100">Save Records</Button>
            ) : (
              <Button size="lg" onClick={() => setIsEditing(true)} className="px-8 rounded-2xl font-bold bg-primary hover:bg-primary/80  -emerald-100">Modify Records</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
