"use client"

import { SectionPage } from "../section-page"
import { MasterDataManagement } from "./master-data-management"
import { ShiftManagement } from "./shift-management"
import { EmailSettings } from "./email-settings"
import { ThemeSettings } from "./theme-settings"
import { RepeatedSettings } from "./repeated-settings"
import { ChangePassword } from "./change-password"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings2, Database, Shield, Bell, Users, Mail, Palette, RotateCcw, KeyRound } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [workspaceId, setWorkspaceId] = useState("")
  const [heldIds, setHeldIds] = useState<string[]>([])

  React.useEffect(() => {
    setWorkspaceId(localStorage.getItem("employeeIdPrefix") || "EMP-")
    try {
      const stored = localStorage.getItem("heldEmployeeIds")
      if (stored) setHeldIds(JSON.parse(stored))
    } catch (e) {}
  }, [])
  const [hrSettings, setHrSettings] = useState({
    workStartTime: "09:00",
    workEndTime: "17:30",
    breakDuration: "1:00",
    weeklyWorkingDays: 5,
    annualLeaves: 20,
    sickLeaves: 10,
    cwh: 6,
    buffaloWallowHourLimit: 3,
    attendanceMode: "biometric",
    leaveApprovalRequired: true,
    overtimeAllowed: true,
    shiftBased: false,
  })

  const handleHrChange = (key: string, value: string | number | boolean) => {
    setHrSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleHrSave = () => {
    // Settings saved
  }

  return (
    <section className="space-y-6">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Settings
          </CardTitle>
          <CardDescription>
            Adjust workspace preferences and account settings.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <Tabs defaultValue="master-data" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            {[
              { id: "general", label: "General", icon: Settings2 },
              { id: "master-data", label: "Master Data", icon: Database },
              { id: "hr", label: "HR Settings", icon: Users },
              { id: "email", label: "Email Settings", icon: Mail },
              { id: "branding", label: "Branding", icon: Palette },
              { id: "security", label: "Security", icon: Shield },
              { id: "repeated", label: "Repeated", icon: RotateCcw },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-transparent data-[state=active]: data-[state=active]:border-emerald-600 border-b-2 border-transparent rounded-none px-0 py-3 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-slate-700 flex items-center gap-2 transition-all"
              >
                <tab.icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee ID Prefix Settings</CardTitle>
                <CardDescription>Manage the default prefix format for new employee IDs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee ID Prefix</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="max-w-md w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                      placeholder="e.g. EMP-"
                    />
                    <Button 
                      onClick={() => {
                        localStorage.setItem("employeeIdPrefix", workspaceId)
                        toast.success('Employee ID Prefix successfully updated!')
                      }} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Update ID
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t mt-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">Hold Employee ID</h4>
                      <p className="text-xs text-slate-500">Add the current ID prefix to the hold list.</p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        if (!workspaceId) return
                        if (heldIds.includes(workspaceId)) {
                          toast.error("This ID is already on hold.")
                          return
                        }
                        const newHeld = [...heldIds, workspaceId]
                        setHeldIds(newHeld)
                        localStorage.setItem("heldEmployeeIds", JSON.stringify(newHeld))
                        setWorkspaceId("EMP-")
                        toast.success('Employee ID Prefix put on hold.')
                      }}
                    >
                      Hold Current ID
                    </Button>
                  </div>
                  
                  {heldIds.length > 0 && (
                    <div className="rounded-md border mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Held ID Prefix</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {heldIds.map((id) => (
                            <TableRow key={id}>
                              <TableCell className="font-medium">{id}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700"
                                  onClick={() => {
                                    const newHeld = heldIds.filter(h => h !== id)
                                    setHeldIds(newHeld)
                                    localStorage.setItem("heldEmployeeIds", JSON.stringify(newHeld))
                                    toast.success("Hold released.")
                                  }}
                                >
                                  Release
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="master-data" className="border-none p-0 outline-none">
          <MasterDataManagement />
        </TabsContent>

        <TabsContent value="hr" className="border-none p-0 outline-none space-y-6">
          <div className="grid gap-6">
            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Working Hours & Schedule</CardTitle>
                <CardDescription>Configure daily working hours and schedule preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Start Time</label>
                    <input
                      type="time"
                      value={hrSettings.workStartTime}
                      onChange={(e) => handleHrChange("workStartTime", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work End Time</label>
                    <input
                      type="time"
                      value={hrSettings.workEndTime}
                      onChange={(e) => handleHrChange("workEndTime", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Break Duration (HH:MM)</label>
                    <input
                      type="text"
                      value={hrSettings.breakDuration}
                      onChange={(e) => handleHrChange("breakDuration", e.target.value)}
                      placeholder="01:00"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weekly Working Days</label>
                    <select
                      value={hrSettings.weeklyWorkingDays}
                      onChange={(e) => handleHrChange("weeklyWorkingDays", parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={5}>5 Days</option>
                      <option value={6}>6 Days</option>
                      <option value={7}>7 Days</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Management */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Policies</CardTitle>
                <CardDescription>Manage annual leave, sick leave, and CWH allocations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Annual Leaves</label>
                    <input
                      type="number"
                      value={hrSettings.annualLeaves}
                      onChange={(e) => handleHrChange("annualLeaves", parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sick Leaves</label>
                    <input
                      type="number"
                      value={hrSettings.sickLeaves}
                      onChange={(e) => handleHrChange("sickLeaves", parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compensatory Work Hours (CWH)</label>
                    <input
                      type="number"
                      value={hrSettings.cwh}
                      onChange={(e) => handleHrChange("cwh", parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CWH Daily Limit (Hours)</label>
                    <input
                      type="number"
                      value={hrSettings.buffaloWallowHourLimit}
                      onChange={(e) => handleHrChange("buffaloWallowHourLimit", parseInt(e.target.value))}
                      step="0.5"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance & Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance & Work Policies</CardTitle>
                <CardDescription>Configure attendance tracking and work arrangement options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attendance Mode</label>
                    <select
                      value={hrSettings.attendanceMode}
                      onChange={(e) => handleHrChange("attendanceMode", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="biometric">Biometric</option>
                      <option value="rfid">RFID Card</option>
                      <option value="manual">Manual Entry</option>
                      <option value="app">Mobile App</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="leaveApproval"
                      checked={hrSettings.leaveApprovalRequired}
                      onChange={(e) => handleHrChange("leaveApprovalRequired", e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="leaveApproval" className="text-sm font-medium cursor-pointer">
                      Require Approval for Leave Requests
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="overtime"
                      checked={hrSettings.overtimeAllowed}
                      onChange={(e) => handleHrChange("overtimeAllowed", e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="overtime" className="text-sm font-medium cursor-pointer">
                      Allow Overtime Work
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="shift"
                      checked={hrSettings.shiftBased}
                      onChange={(e) => handleHrChange("shiftBased", e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="shift" className="text-sm font-medium cursor-pointer">
                      Enable Shift-Based Work
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ShiftManagement />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleHrSave} className="bg-emerald-600 hover:bg-emerald-700">
                Save HR Settings
              </Button>
              <Button variant="outline">
                Reset to Default
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="border-none p-0 outline-none">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="branding" className="border-none p-0 outline-none">
          <ThemeSettings />
        </TabsContent>

        <TabsContent value="security" className="border-none p-0 outline-none">
          <ChangePassword />
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid gap-6">
            <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center py-20 bg-slate-50/50">
              <Bell className="size-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900">Notification Preferences</h3>
              <p className="text-sm text-slate-500 max-w-xs">Manage system-wide alerts, email triggers, and push notifications.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="repeated" className="border-none p-0 outline-none">
          <RepeatedSettings />
        </TabsContent>
      </Tabs>
        </CardContent>
    </section>
  )
}
