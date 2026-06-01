"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useAnalytics } from "@/hooks/use-analytics"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { staffService } from "@/lib/services/staff-service"

import {
  ProfileImageUpload,
  BasicInfoSection,
  WorkInfoSection,
  ContactDetailsSection,
  DynamicRowSection,
  SelectWithAdd,
  SocialPresenceSection,
  type FirstSlideStaffForm,
  Row,
} from "./staff-form-sections"

/** Generate a short unique ID for dynamic rows. */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface AddStaffFormProps {
  onCancel?: () => void
  onStaffAdded?: (staff: Record<string, unknown>) => void
}

export function AddStaffForm({ onCancel, onStaffAdded }: AddStaffFormProps) {
  const { trackEvent } = useAnalytics("AddStaffForm")
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [direction, setDirection] = React.useState(0)
  const [savedStaff, setSavedStaff] = React.useState<Record<string, unknown> | null>(null)
  const [formError, setFormError] = React.useState("")
  const [firstSlideData, setFirstSlideData] = React.useState<FirstSlideStaffForm>({
    displayId: "",
    firstName: "",
    lastName: "",
    nickname: "",
    email: "",
    password: "",
    department: "",
    location: "",
    designation: "",
    roleName: "",
    employmentType: "",
    status: "Active",
    branchName: "",
    shift: "",
    sourceOfHire: "",
    joiningDate: "",
    currentExperience: "",
    totalExperience: "",
  })

  React.useEffect(() => {
    const prefix = localStorage.getItem("employeeIdPrefix")
    if (prefix) {
      const count = parseInt(localStorage.getItem("employeeIdCount") || "1", 10)
      const displayId = `${prefix}${String(count).padStart(3, '0')}`
      setFirstSlideData(prev => ({ ...prev, displayId }))
    }
  }, [])

  const [workExperience, setWorkExperience] = React.useState<Row[]>([
    { id: "1", company: "", title: "", from: "", to: "", description: "", relevant: false },
  ])
  const [educationDetails, setEducationDetails] = React.useState<Row[]>([
    { id: "1", institute: "", degree: "", specialization: "", completionDate: "" },
  ])
  const [dependentDetails, setDependentDetails] = React.useState<Row[]>([
    { id: "1", name: "", relationship: "", dob: "" },
  ])

  const addRow = (setter: React.Dispatch<React.SetStateAction<Row[]>>, type: string) => {
    setter((prev) => [...prev, { id: generateId() }])
    trackEvent('add_form_row', { rowType: type })
  }

  const removeRow = (setter: React.Dispatch<React.SetStateAction<Row[]>>, id: string, type: string) => {
    setter((prev) => prev.filter((row) => row.id !== id))
    trackEvent('remove_form_row', { rowType: type, rowId: id })
  }

  const updateFirstSlideField = (field: keyof FirstSlideStaffForm, value: string) => {
    setFirstSlideData((prev) => ({ ...prev, [field]: value }))
    setFormError("")
  }

  const createStaffMutation = useMutation({
    mutationFn: () => staffService.createStaff({
      empId: firstSlideData.displayId.trim() || undefined,
      firstName: firstSlideData.firstName.trim(),
      lastName: firstSlideData.lastName.trim(),
      email: firstSlideData.email.trim(),
      avatar: firstSlideData.avatar || "",
      department: firstSlideData.department || null,
      phone: null,
      roleName: firstSlideData.roleName || firstSlideData.designation || null,
      branchName: firstSlideData.branchName || firstSlideData.location || null,
      employmentType: firstSlideData.employmentType || null,
      status: firstSlideData.status.toLowerCase() === "inactive" ? "inactive" : "active",
      sourceOfHire: firstSlideData.sourceOfHire || null,
      workExperience,
      educationDetails,
      dependentDetails,
      currentExperience: firstSlideData.currentExperience || null,
      totalExperience: firstSlideData.totalExperience || null,
    }),
    onSuccess: (staff) => {
      setSavedStaff(staff)
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      queryClient.invalidateQueries({ queryKey: ["staff-stats"] })
      trackEvent('save_employee_success')

      const fullName = `${firstSlideData.firstName} ${firstSlideData.lastName}`.trim()
      // Staff created
    },
    onError: (error: any) => {
      setFormError(error?.message || "Failed to create employee. Please try again.")
    },
  })

  const [successModalOpen, setSuccessModalOpen] = React.useState(false)

  const saveFirstSlide = async () => {
    if (savedStaff) return savedStaff

    if (!firstSlideData.firstName.trim() || !firstSlideData.email.trim()) {
      setFormError("First name and email address are required.")
      return null
    }

    const finalPassword = firstSlideData.password || Math.random().toString(36).slice(-8) + "A1!"
    if (!firstSlideData.password) {
      setFirstSlideData(prev => ({ ...prev, password: finalPassword }))
    }

    trackEvent('save_employee_start')
    try {
      return await staffService.createStaff({
        empId: firstSlideData.displayId.trim() || undefined,
        firstName: firstSlideData.firstName.trim(),
        lastName: firstSlideData.lastName.trim(),
        email: firstSlideData.email.trim(),
        avatar: firstSlideData.avatar || "",
        password: finalPassword,
        department: firstSlideData.department || null,
        phone: null,
        roleName: firstSlideData.roleName || firstSlideData.designation || null,
        branchName: firstSlideData.branchName || firstSlideData.location || null,
        employmentType: firstSlideData.employmentType || null,
        status: firstSlideData.status.toLowerCase() === "inactive" ? "inactive" : "active",
        sourceOfHire: firstSlideData.sourceOfHire || null,
        workExperience,
        educationDetails,
        dependentDetails,
        currentExperience: firstSlideData.currentExperience || null,
        totalExperience: firstSlideData.totalExperience || null,
      }).then(staff => {
        setSavedStaff(staff)
        
        // Increment the employee ID count in localStorage
        const currentCount = parseInt(localStorage.getItem("employeeIdCount") || "1", 10)
        localStorage.setItem("employeeIdCount", String(currentCount + 1))
        
        queryClient.invalidateQueries({ queryKey: ["staff"] })
        queryClient.invalidateQueries({ queryKey: ["staff-stats"] })
        trackEvent('save_employee_success')
        return staff
      })
    } catch (err: any) {
      setFormError(err?.message || "Failed to create employee. Please try again.")
      return null
    }
  }

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!firstSlideData.firstName.trim() || !firstSlideData.email.trim()) {
        setFormError("First name and email address are required.")
        return
      }
    }

    setDirection(1)
    setCurrentStep((prev) => Math.min(prev + 1, 5))
    trackEvent('form_next_step', { from: currentStep, to: currentStep + 1 })
  }

  const prevStep = () => {
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    trackEvent('form_prev_step', { from: currentStep, to: currentStep - 1 })
  }

  const handleSave = async () => {
    const staff = await saveFirstSlide()
    if (staff) {
      setSuccessModalOpen(true)
    }
  }

  const completeAndClose = () => {
    setSuccessModalOpen(false)
    if (savedStaff) {
      onStaffAdded?.(savedStaff)
      if (onCancel) onCancel()
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-hidden">
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Member Created</DialogTitle>
            <DialogDescription>
              The account has been successfully created. Please securely share the following login credentials with the user.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4 bg-muted/50 p-4 rounded-lg">
            <div className="grid flex-1 gap-2">
              <div className="text-sm">
                <span className="font-semibold">Email:</span> {firstSlideData.email}
              </div>
              <div className="text-sm">
                <span className="font-semibold">Password:</span> {firstSlideData.password}
              </div>
            </div>
            <Button size="sm" className="px-3" onClick={() => {
              navigator.clipboard.writeText(`Email: ${firstSlideData.email}\nPassword: ${firstSlideData.password}`)
            }}>
              <span className="sr-only">Copy</span>
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="default" onClick={completeAndClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {formError && (
        <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}
      {/* Progress Indicator */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center gap-2 flex-1 relative">
              <div 
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10",
                  currentStep >= step ? "bg-bg-primary text-primary-foreground  -emerald-200" : "bg-muted text-muted-foreground"
                )}
              >
                {step}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider transition-colors duration-300",
                currentStep >= step ? "text-slate-700" : "text-muted-foreground"
              )}>
                {step === 1 ? "Profile" : step === 2 ? "Work Info" : step === 3 ? "Contact" : step === 4 ? "Social" : "History"}
              </span>
                  {step < 5 && (
                <div className="absolute top-4 left-[60%] right-[-40%] h-[2px] bg-muted -z-0">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

        <div className="relative flex-1 overflow-hidden px-1">
          <div
            className="h-full"
          >
            <ScrollArea className="h-full px-5">
              <div className="space-y-8 py-4">
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="flex gap-12 items-start mb-6">
                      <div className="flex-shrink-0">
                        <ProfileImageUpload 
                          avatar={firstSlideData.avatar} 
                          onAvatarChange={(url) => updateFirstSlideField("avatar", url)} 
                        />
                      </div>
                      <div className="flex-1">
                        <BasicInfoSection formData={firstSlideData} onChange={updateFirstSlideField} />
                      </div>
                    </div>
                    <Separator />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <WorkInfoSection formData={firstSlideData} onChange={updateFirstSlideField} />
                    <Separator />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <ContactDetailsSection />
                    <Separator />
                    <FieldSet>
                      <FieldLegend>Separation Information</FieldLegend>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>Date of Exit</FieldLabel>
                          <Input type="date" placeholder="dd-MMM-yyyy" />
                        </Field>
                      </div>
                    </FieldSet>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    <SocialPresenceSection />
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-8 pb-8">
                    <DynamicRowSection
                      title="Work experience"
                      rows={workExperience}
                      onAdd={() => addRow(setWorkExperience, 'work_experience')}
                      onRemove={(id) => removeRow(setWorkExperience, id, 'work_experience')}
                      renderRow={(row) => (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Company name</FieldLabel>
                            <Input placeholder="Company name" />
                          </Field>
                          <Field>
                            <FieldLabel>Job Title</FieldLabel>
                            <Input placeholder="Job Title" />
                          </Field>
                          <Field>
                            <FieldLabel>From Date</FieldLabel>
                            <Input type="date" />
                          </Field>
                          <Field>
                            <FieldLabel>To Date</FieldLabel>
                            <Input type="date" />
                          </Field>
                          <Field className="sm:col-span-2">
                            <FieldLabel>Job Description</FieldLabel>
                            <textarea className="min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring" placeholder="Job Description" />
                          </Field>
                          <div className="flex items-center gap-2">
                            <Checkbox id={`relevant-${row.id}`} />
                            <label htmlFor={`relevant-${row.id}`} className="text-sm font-medium">Relevant</label>
                          </div>
                        </div>
                      )}
                    />
                    <Separator />
                    <DynamicRowSection
                      title="Education Details"
                      rows={educationDetails}
                      onAdd={() => addRow(setEducationDetails, 'education')}
                      onRemove={(id) => removeRow(setEducationDetails, id, 'education')}
                      renderRow={(row) => (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Institute Name</FieldLabel>
                            <Input placeholder="Institute Name" />
                          </Field>
                          <Field>
                            <FieldLabel>Degree/Diploma</FieldLabel>
                            <Input placeholder="Degree/Diploma" />
                          </Field>
                          <Field>
                            <FieldLabel>Specialization</FieldLabel>
                            <Input placeholder="Specialization" />
                          </Field>
                          <Field>
                            <FieldLabel>Date of Completion</FieldLabel>
                            <Input type="date" />
                          </Field>
                        </div>
                      )}
                    />
                    <Separator />
                    <DynamicRowSection
                      title="Dependent Details"
                      rows={dependentDetails}
                      onAdd={() => addRow(setDependentDetails, 'dependents')}
                      onRemove={(id) => removeRow(setDependentDetails, id, 'dependents')}
                      renderRow={(row) => (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input placeholder="Name" />
                          </Field>
                          <SelectWithAdd
                            label="Relationship"
                            options={["Spouse", "Child", "Parent"]}
                          />
                          <Field>
                            <FieldLabel>Date of Birth</FieldLabel>
                            <Input type="date" />
                          </Field>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

      <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
        <Button variant="ghost" onClick={currentStep === 1 ? onCancel : prevStep}>
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <div className="flex gap-3">
          {currentStep < 5 ? (
            <Button className="bg-primary hover:bg-primary/80 w-32" onClick={nextStep} disabled={createStaffMutation.isPending}>
              {createStaffMutation.isPending ? "Saving..." : "Next Step"}
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/80 w-32" onClick={handleSave} disabled={createStaffMutation.isPending}>
              {createStaffMutation.isPending ? "Saving..." : "Save Employee"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
