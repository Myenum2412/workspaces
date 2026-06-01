"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, Eye, Code } from "lucide-react"


interface EmailSettings {
  taskAssignedEmailEnabled: boolean
  staffCreatedEmailEnabled: boolean
  welcomeSubject: string
  welcomeTemplate: string
  taskAssignedSubject: string
  taskAssignedTemplate: string
  staffCreatedSubject: string
  staffCreatedTemplate: string
}

const DEFAULT_WELCOME = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
  <h2 style="color: #059669;">Welcome to the Team!</h2>
  <p>Hi {{firstName}},</p>
  <p>Your staff account has been created successfully. Here are your account details:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Employee ID:</strong> {{displayId}}</p>
    <p><strong>Department:</strong> {{department}}</p>
    <p><strong>Role:</strong> {{roleName}}</p>
  </div>
  <p>You can now log in to the system and start using the platform.</p>
  <p>Best regards,<br/>The Team</p>
</div>`

const DEFAULT_TASK = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
  <h2 style="color: #059669;">New Task Assigned</h2>
  <p>Hi {{assigneeName}},</p>
  <p>You have been assigned a new task. Here are the details:</p>
  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p><strong>Task:</strong> {{taskTitle}}</p>
    <p><strong>Project:</strong> {{projectName}}</p>
    <p><strong>Priority:</strong> {{priority}}</p>
    <p><strong>Due Date:</strong> {{dueDate}}</p>
  </div>
  <p>Please log in to the system to view more details.</p>
  <p>Best regards,<br/>The Team</p>
</div>`

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    taskAssignedEmailEnabled: false,
    staffCreatedEmailEnabled: false,
    welcomeSubject: "Welcome to the Team - Your Account is Ready",
    welcomeTemplate: DEFAULT_WELCOME,
    taskAssignedSubject: "New Task Assigned to You",
    taskAssignedTemplate: DEFAULT_TASK,
    staffCreatedSubject: "Welcome to the Team - Your Account is Ready",
    staffCreatedTemplate: DEFAULT_WELCOME,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSettings() }, [])

  function loadSettings() {
    try {
      const stored = localStorage.getItem("email-settings")
      const e: Partial<EmailSettings> = stored ? JSON.parse(stored) : {}
      setSettings({
        taskAssignedEmailEnabled: e.taskAssignedEmailEnabled || false,
        staffCreatedEmailEnabled: e.staffCreatedEmailEnabled || false,
        welcomeSubject: e.welcomeSubject || "Welcome to the Team - Your Account is Ready",
        welcomeTemplate: e.welcomeTemplate || DEFAULT_WELCOME,
        taskAssignedSubject: e.taskAssignedSubject || "New Task Assigned to You",
        taskAssignedTemplate: e.taskAssignedTemplate || DEFAULT_TASK,
        staffCreatedSubject: e.staffCreatedSubject || "Welcome to the Team - Your Account is Ready",
        staffCreatedTemplate: e.staffCreatedTemplate || DEFAULT_WELCOME,
      })
    } catch (err) {
      console.error("Error loading email settings:", err)
    } finally {
      setLoading(false)
    }
  }

  function saveSettings() {
    setSaving(true)
    try {
      localStorage.setItem("email-settings", JSON.stringify(settings))
      alert("Email settings saved!")
    } catch (err) {
      console.error("Error saving email settings:", err)
      alert("Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Toggles */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Send className="size-4" />
              Email Notifications
            </h3>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Task Assigned Email</p>
                <p className="text-xs text-muted-foreground">Notify staff when task assigned</p>
              </div>
              <Switch
                checked={settings.taskAssignedEmailEnabled}
                onCheckedChange={(c) => setSettings({ ...settings, taskAssignedEmailEnabled: c })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Staff Created Email</p>
                <p className="text-xs text-muted-foreground">Welcome email on new staff</p>
              </div>
              <Switch
                checked={settings.staffCreatedEmailEnabled}
                onCheckedChange={(c) => setSettings({ ...settings, staffCreatedEmailEnabled: c })}
              />
            </div>
          </div>

          {/* Welcome Email Template */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Welcome Email (Staff Created)</h3>
            <Label>Subject</Label>
            <Input
              value={settings.staffCreatedSubject}
              onChange={(e) => setSettings({ ...settings, staffCreatedSubject: e.target.value })}
            />
            <Label>Body</Label>
            <Tabs defaultValue="edit" className="w-full">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{firstName}}"}, {"{{email}}"}, {"{{displayId}}"}, {"{{department}}"}, {"{{roleName}}"}
                </p>
                <TabsList className="grid w-36 grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-1"><Code className="size-3" /> Edit</TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1"><Eye className="size-3" /> Preview</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={settings.staffCreatedTemplate}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, staffCreatedTemplate: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="min-h-[200px] rounded-lg border bg-white p-4"
                  dangerouslySetInnerHTML={{
                    __html: settings.staffCreatedTemplate
                      .replace(/\{\{firstName\}\}/g, "John")
                      .replace(/\{\{email\}\}/g, "john@company.com")
                      .replace(/\{\{displayId\}\}/g, "EMP123456")
                      .replace(/\{\{department\}\}/g, "Engineering")
                      .replace(/\{\{roleName\}\}/g, "Developer")
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Task Assigned Template */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Task Assigned Email</h3>
            <Label>Subject</Label>
            <Input
              value={settings.taskAssignedSubject}
              onChange={(e) => setSettings({ ...settings, taskAssignedSubject: e.target.value })}
            />
            <Label>Body</Label>
            <Tabs defaultValue="edit" className="w-full">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{assigneeName}}"}, {"{{taskTitle}}"}, {"{{projectName}}"}, {"{{priority}}"}, {"{{dueDate}}"}
                </p>
                <TabsList className="grid w-36 grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-1"><Code className="size-3" /> Edit</TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1"><Eye className="size-3" /> Preview</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={settings.taskAssignedTemplate}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({ ...settings, taskAssignedTemplate: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="min-h-[200px] rounded-lg border bg-white p-4"
                  dangerouslySetInnerHTML={{
                    __html: settings.taskAssignedTemplate
                      .replace(/\{\{assigneeName\}\}/g, "John")
                      .replace(/\{\{taskTitle\}\}/g, "Fix login bug")
                      .replace(/\{\{projectName\}\}/g, "Website Redesign")
                      .replace(/\{\{priority\}\}/g, "High")
                      .replace(/\{\{dueDate\}\}/g, "2026-05-15")
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="bg-primary hover:bg-primary/80">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
