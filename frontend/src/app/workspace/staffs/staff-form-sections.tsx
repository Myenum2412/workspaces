"use client"

import * as React from "react"
import { PlusIcon, Trash2Icon, CameraIcon } from "lucide-react"
import TableUpload from "@/components/table-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Types
export interface Row {
  id: string
  [key: string]: string | boolean
}

// Sub-components
export function ProfileImageUpload() {
  const [preview, setPreview] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError("File size exceeds 50MB limit.")
      setPreview(null)
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative group">
        <Avatar className="size-32 border-2 border-emerald-100 ring-4 ring-emerald-50/50  overflow-hidden">
          <AvatarImage src={preview || ""} className="object-cover" />
          <AvatarFallback className="bg-slate-50 text-slate-700 text-2xl font-bold">
            {preview ? "" : "AM"}
          </AvatarFallback>
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
            <CameraIcon className="size-8 mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Change</span>
            <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
          </label>
        </Avatar>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Profile Photo</h3>
        <p className="text-xs text-muted-foreground">Up to 50MB. PNG, JPG or GIF.</p>
        {error && <p className="text-xs font-medium text-destructive mt-2">{error}</p>}
      </div>
    </div>
  )
}

export function SelectWithAdd({
  label,
  options: initialOptions,
  placeholder = "Select",
  value,
  onValueChange,
}: {
  label: string
  options: string[]
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [options, setOptions] = React.useState(initialOptions)
  const [newValue, setNewValue] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const handleAdd = () => {
    if (newValue.trim() && !options.includes(newValue.trim())) {
      setOptions([...options, newValue.trim()])
      setNewValue("")
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <select
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          {...(onValueChange
            ? {
                value: value ?? "",
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value),
              }
            : {})}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="shrink-0 h-8 w-8 border-emerald-100 bg-slate-50/50 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800"
            >
              <PlusIcon className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{label} Management</DialogTitle>
              <DialogDescription>
                Manage the list of available options for {label.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`New ${label.toLowerCase()}...`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} className="bg-emerald-600 shrink-0">
                  Add
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Current Options</Label>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-1">
                    {options.map((opt) => (
                      <div key={opt} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                        {opt}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setOptions(options.filter(o => o !== opt))}
                        >
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    ))}
                    {options.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">No options available.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Field>
  )
}

// Sections
export type FirstSlideStaffForm = {
  displayId: string
  firstName: string
  lastName: string
  nickname: string
  email: string
  password?: string
  department: string
  location: string
  designation: string
  roleName: string
  employmentType: string
  status: string
  branchName: string
  shift: string
  sourceOfHire: string
  joiningDate: string
  currentExperience: string
  totalExperience: string
}

export function BasicInfoSection({
  formData,
  onChange,
}: {
  formData?: FirstSlideStaffForm
  onChange?: (field: keyof FirstSlideStaffForm, value: string) => void
}) {
  return (
    <FieldSet>
      <FieldLegend>Basic information</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <Field>
          <FieldLabel>Employee ID</FieldLabel>
          <Input value={formData?.displayId ?? ""} onChange={(e) => onChange?.("displayId", e.target.value)} placeholder="Myenum241220" />
        </Field>
        <Field>
          <FieldLabel>First Name</FieldLabel>
          <Input value={formData?.firstName ?? ""} onChange={(e) => onChange?.("firstName", e.target.value)} placeholder="Myenum" />
        </Field>
        <Field>
          <FieldLabel>Last Name</FieldLabel>
          <Input value={formData?.lastName ?? ""} onChange={(e) => onChange?.("lastName", e.target.value)} placeholder="Am" />
        </Field>
        <Field>
          <FieldLabel>Nick name</FieldLabel>
          <Input value={formData?.nickname ?? ""} onChange={(e) => onChange?.("nickname", e.target.value)} placeholder="Nick" />
        </Field>
        <Field>
          <FieldLabel>Email address</FieldLabel>
          <Input type="email" value={formData?.email ?? ""} onChange={(e) => onChange?.("email", e.target.value)} placeholder="myenumam@gmail.com" />
        </Field>
        <Field>
          <FieldLabel>Password</FieldLabel>
          <Input type="text" value={formData?.password ?? ""} onChange={(e) => onChange?.("password", e.target.value)} placeholder="Auto-generate if empty" />
        </Field>
        <Field className="sm:col-span-3">
          <FieldLabel>Upload Files</FieldLabel>
          <TableUpload maxFiles={5} accept="*" />
        </Field>
      </div>
    </FieldSet>
  )
}

export function WorkInfoSection({
  formData,
  onChange,
}: {
  formData?: FirstSlideStaffForm
  onChange?: (field: keyof FirstSlideStaffForm, value: string) => void
}) {
  return (
    <FieldSet>
      <FieldLegend>Work Information</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectWithAdd
          label="Department"
          options={["Engineering", "HR", "Sales"]}
          value={formData?.department}
          onValueChange={(value) => onChange?.("department", value)}
        />
        <SelectWithAdd
          label="Location"
          options={["Remote", "Headquarters"]}
          value={formData?.location}
          onValueChange={(value) => onChange?.("location", value)}
        />
        <SelectWithAdd
          label="Designation"
          options={["Software Engineer", "Manager"]}
          value={formData?.designation}
          onValueChange={(value) => onChange?.("designation", value)}
        />
        <SelectWithAdd
          label="Role"
          options={["Staff Management", "Manager", "Admin", "User"]}
          value={formData?.roleName}
          onValueChange={(value) => onChange?.("roleName", value)}
        />
        <SelectWithAdd
          label="Employment Type"
          options={["Trainee", "Full Time", "Contract"]}
          value={formData?.employmentType}
          onValueChange={(value) => onChange?.("employmentType", value)}
        />
        <SelectWithAdd
          label="Employee Status"
          options={["Active", "Inactive"]}
          value={formData?.status}
          onValueChange={(value) => onChange?.("status", value)}
        />
        <SelectWithAdd
          label="Branch"
          options={["India", "USA", "UK", "Canada", "Germany"]}
          value={formData?.branchName}
          onValueChange={(value) => onChange?.("branchName", value)}
        />
        <ShiftSelect value={formData?.shift} onValueChange={(value) => onChange?.("shift", value)} />
        <SelectWithAdd
          label="Source of Hire"
          options={["LinkedIn", "Referral"]}
          value={formData?.sourceOfHire}
          onValueChange={(value) => onChange?.("sourceOfHire", value)}
        />
        <Field>
          <FieldLabel>Date of Joining</FieldLabel>
          <Input type="date" value={formData?.joiningDate ?? ""} onChange={(e) => onChange?.("joiningDate", e.target.value)} placeholder="dd-MMM-yyyy" />
        </Field>
        <Field>
          <FieldLabel>Current Experience</FieldLabel>
          <Input value={formData?.currentExperience ?? ""} onChange={(e) => onChange?.("currentExperience", e.target.value)} placeholder="e.g. 2 years" />
        </Field>
        <Field>
          <FieldLabel>Total Experience</FieldLabel>
          <Input value={formData?.totalExperience ?? ""} onChange={(e) => onChange?.("totalExperience", e.target.value)} placeholder="-" />
        </Field>
      </div>
    </FieldSet>
  )
}

function ShiftSelect({
  value,
  onValueChange,
}: {
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [shifts] = React.useState([
    { id: "1", title: "Morning", startTime: "09:00", endTime: "17:00" },
    { id: "2", title: "Evening", startTime: "14:00", endTime: "22:00" },
  ])

  const shiftOptions = shifts.map((s) => `${s.title} (${s.startTime} - ${s.endTime})`)

  return (
    <SelectWithAdd
      label="Shifts"
      options={shiftOptions}
      placeholder="Select Shift"
      value={value}
      onValueChange={onValueChange}
    />
  )
}

export function PersonalDetailsSection() {
  return (
    <FieldSet>
      <FieldLegend>Personal Details</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel>Date of Birth</FieldLabel>
          <Input type="date" placeholder="dd-MMM-yyyy" />
        </Field>
        <Field>
          <FieldLabel>Age</FieldLabel>
          <Input type="number" placeholder="0" />
        </Field>
        <SelectWithAdd
          label="Gender"
          options={["Male", "Female", "Other"]}
        />
        <SelectWithAdd
          label="Marital Status"
          options={["Single", "Married"]}
        />
        <Field className="sm:col-span-2 lg:col-span-3">
          <FieldLabel>About Me</FieldLabel>
          <textarea className="min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring" placeholder="Bio..." />
        </Field>
        <Field className="sm:col-span-2 lg:col-span-3">
          <FieldLabel>Ask me about/Expertise</FieldLabel>
          <Input placeholder="Expertise..." />
        </Field>
      </div>
    </FieldSet>
  )
}

export function IdentitySection() {
  return (
    <FieldSet>
      <FieldLegend>Identity Information</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>Passport</FieldLabel>
          <Input placeholder="Passport" />
        </Field>
        <Field>
          <FieldLabel>PAN</FieldLabel>
          <Input placeholder="PAN" />
        </Field>
        <Field>
          <FieldLabel>Aadhaar</FieldLabel>
          <Input placeholder="Aadhaar" />
        </Field>
      </div>
    </FieldSet>
  )
}

export function ContactDetailsSection() {
  const [countryPrefix, setCountryPrefix] = React.useState("+91");
  return (
    <FieldSet>
      <FieldLegend>Contact Details</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field>
          <FieldLabel>Work Phone Number</FieldLabel>
          <Input placeholder="Work Phone Number" />
        </Field>
        <Field>
          <FieldLabel>Extension</FieldLabel>
          <Input placeholder="Extension" />
        </Field>
        <Field>
          <FieldLabel>Seating Location</FieldLabel>
          <Input placeholder="Seating Location" />
        </Field>
        <Field>
          <FieldLabel>Tags</FieldLabel>
          <Input placeholder="Tags" />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Present Address</h4>
          <div className="grid grid-cols-1 gap-3">
            <Input placeholder="Address line 1" />
            <Input placeholder="Address line 2" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="City" />
              <Input placeholder="Postal Code" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectWithAdd
                label="Country"
                options={["India", "USA"]}
                placeholder="Select Country"
              />
              <SelectWithAdd
                label="State"
                options={["Karnataka", "California"]}
                placeholder="Select State"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Permanent Address</h4>
            <div className="flex items-center gap-2">
              <Checkbox id="sameAsPresent" />
              <Label htmlFor="sameAsPresent" className="text-xs font-normal">Same as Present Address</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Input placeholder="Address line 1" />
            <Input placeholder="Address line 2" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="City" />
              <Input placeholder="Postal Code" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SelectWithAdd
                label="Country"
                options={["India", "USA"]}
                placeholder="Select Country"
              />
              <SelectWithAdd
                label="State"
                options={["Karnataka", "California"]}
                placeholder="Select State"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Personal Mobile Number</FieldLabel>
          <div className="flex gap-2">
            {/* Country selector */}
            <select
              className="h-8 border rounded-lg px-2"
              value={countryPrefix}
              onChange={(e) => setCountryPrefix(e.target.value)}
            >
              <option value="+91">India (+91)</option>
              <option value="+1">USA (+1)</option>
              <option value="+44">UK (+44)</option>
            </select>
            {/* Prefix display */}
            <div className="flex h-8 w-16 items-center justify-center rounded-lg border border-input bg-muted/30 text-sm font-medium">
              {countryPrefix}
            </div>
            <Input className="flex-1" placeholder="Mobile Number" />
          </div>
        </Field>
        <Field>
          <FieldLabel>Personal Email Address</FieldLabel>
          <Input type="email" placeholder="Personal Email Address" />
        </Field>
        <Field>
          <FieldLabel>Emergency Contact Name</FieldLabel>
          <Input placeholder="Contact Name" />
        </Field>
        <Field>
          <FieldLabel>Emergency Contact Phone</FieldLabel>
          <Input placeholder="Emergency Phone" />
        </Field>
      </div>
    </FieldSet>
  )
}

export function BankDetailsSection() {
  return (
    <FieldSet>
      <FieldLegend>Bank & Compensation</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field>
          <FieldLabel>Bank Name</FieldLabel>
          <Input placeholder="e.g. HDFC Bank" />
        </Field>
        <Field>
          <FieldLabel>Account Number</FieldLabel>
          <Input placeholder="000000000000" />
        </Field>
        <Field>
          <FieldLabel>IFSC Code</FieldLabel>
          <Input placeholder="IFSC0000123" />
        </Field>
        <Field>
          <FieldLabel>Branch Name</FieldLabel>
          <Input placeholder="Branch Name" />
        </Field>
        <Field>
          <FieldLabel>Monthly CTC</FieldLabel>
          <Input type="number" placeholder="0.00" />
        </Field>
        <SelectWithAdd
          label="Payment Mode"
          options={["Bank Transfer", "Cheque", "Cash"]}
        />
      </div>
    </FieldSet>
  )
}

export function SocialPresenceSection() {
  const [links, setLinks] = React.useState<Array<{ title: string; url: string }>>([
    { title: "LinkedIn", url: "" },
    { title: "GitHub/Portfolio", url: "" },
    { title: "Twitter/X", url: "" },
    { title: "Other Blog/Site", url: "" },
  ]);
  const [open, setOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");

  const addLink = () => {
    if (newTitle && newUrl) {
      setLinks([...links, { title: newTitle, url: newUrl }]);
      setNewTitle("");
      setNewUrl("");
      setOpen(false);
    }
  };

  const updateLink = (idx: number, url: string) => {
    const newLinks = [...links];
    newLinks[idx].url = url;
    setLinks(newLinks);
  };

  return (
    <FieldSet>
      <FieldLegend>Social & Presence</FieldLegend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {links.map((link, idx) => (
          <Field key={idx}>
            <FieldLabel>{link.title}</FieldLabel>
            <Input
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(idx, e.target.value)}
            />
          </Field>
        ))}
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="col-span-full">
          <PlusIcon className="mr-2 size-3.5" /> Add Social Link
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Link</DialogTitle>
            <DialogDescription>Enter the title and URL for a new social media link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input id="url" placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addLink}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FieldSet>
  );
}




export function DynamicRowSection({
  title,
  rows,
  onAdd,
  onRemove,
  renderRow,
}: {
  title: string
  rows: Row[]
  onAdd: () => void
  onRemove: (id: string) => void
  renderRow: (row: Row) => React.ReactNode
}) {
  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>{title}</FieldLegend>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon className="mr-2 size-3.5" />
          Add Row
        </Button>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="relative rounded-xl border bg-muted/10 p-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(row.id)}
            >
              <Trash2Icon className="size-4" />
            </Button>
            {renderRow(row)}
          </div>
        ))}
      </div>
    </FieldSet>
  );
}
