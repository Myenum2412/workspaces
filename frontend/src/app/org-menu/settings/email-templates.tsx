"use client"

import * as React from "react"
import {
  MailIcon, SaveIcon, EyeIcon, CodeIcon, RotateCcwIcon,
  CheckCircle2Icon, AlertCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface EmailTemplateConfig {
  welcomeEnabled: boolean
  welcomeSubject: string
  welcomeBody: string
  taskAssignedEnabled: boolean
  taskAssignedSubject: string
  taskAssignedBody: string
}

const DEFAULT_CONFIG: EmailTemplateConfig = {
  welcomeEnabled: true,
  welcomeSubject: "Welcome to {{companyName}} — Your Account is Ready",
  welcomeBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Welcome to {{companyName}}!</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Your account has been created successfully</p>
  </div>
  <div style="padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 15px;">Hi <strong>{{firstName}}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Welcome aboard! Your owner account is now active. Here are your login credentials:</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Email</td><td style="padding: 4px 0; font-weight: 600;">{{email}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Password</td><td style="padding: 4px 0; font-weight: 600; color: #dc2626;">{{password}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Employee ID</td><td style="padding: 4px 0; font-weight: 600;">{{empId}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Company</td><td style="padding: 4px 0; font-weight: 600;">{{companyName}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Role</td><td style="padding: 4px 0; font-weight: 600;">{{roleName}}</td></tr>
      </table>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 16px 0;">
      <strong>Important:</strong> Please save this password securely. It won't be shown again.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{loginUrl}}" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Log In to Your Account</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Best regards,<br/><strong>{{companyName}} Team</strong></p>
  </div>
</div>`,
  taskAssignedEnabled: false,
  taskAssignedSubject: "New Task Assigned: {{taskTitle}}",
  taskAssignedBody: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">New Task Assigned</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">{{companyName}} — Task Management</p>
  </div>
  <div style="padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 15px;">Hi <strong>{{firstName}}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A new task has been assigned to you. Here are the details:</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px;">
        <tr><td style="padding: 4px 0; color: #64748b; width: 140px;">Task</td><td style="padding: 4px 0; font-weight: 600;">{{taskTitle}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Project</td><td style="padding: 4px 0; font-weight: 600;">{{projectName}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Priority</td><td style="padding: 4px 0; font-weight: 600;">{{priority}}</td></tr>
        <tr><td style="padding: 4px 0; color: #64748b;">Due Date</td><td style="padding: 4px 0; font-weight: 600;">{{dueDate}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{taskUrl}}" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Task</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Best regards,<br/><strong>{{companyName}} Team</strong></p>
  </div>
</div>`,
}

const PREVIEW_DATA: Record<string, string> = {
  firstName: "John",
  email: "john@company.com",
  empId: "EMP123456",
  department: "Engineering",
  roleName: "Developer",
  companyName: "Acme Inc.",
  loginUrl: "https://app.example.com/login",
  taskTitle: "Fix login page bug",
  projectName: "Website Redesign",
  priority: "High",
  dueDate: "2026-05-20",
  taskUrl: "https://app.example.com/workspace/tasks/abc123",
}

function renderTemplate(template: string): string {
  let result = template
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }
  return result
}

const WELCOME_VARS = ["{{firstName}}", "{{email}}", "{{password}}", "{{empId}}", "{{department}}", "{{roleName}}", "{{companyName}}", "{{loginUrl}}"]
const TASK_VARS = ["{{firstName}}", "{{taskTitle}}", "{{projectName}}", "{{priority}}", "{{dueDate}}", "{{companyName}}", "{{taskUrl}}"]

export function EmailTemplates() {
  const [config, setConfig] = React.useState<EmailTemplateConfig>(() => {
    try {
      const stored = localStorage.getItem("org-email-templates")
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG
    } catch {
      return DEFAULT_CONFIG
    }
  })
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const handleSave = () => {
    setSaving(true)
    setSaved(false)
    try {
      localStorage.setItem("org-email-templates", JSON.stringify(config))
      toast.success("Email templates saved")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Error saving email templates:", err)
      toast.error("Failed to save email templates")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
    toast.info("Templates reset to defaults")
  }

  const updateWelcome = (field: string, value: string | boolean) =>
    setConfig((prev) => ({ ...prev, [`welcome${field}`]: value }))
  const updateTask = (field: string, value: string | boolean) =>
    setConfig((prev) => ({ ...prev, [`taskAssigned${field}`]: value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-primary">
            <MailIcon className="size-6 text-slate-600" />
            Email Templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure email templates sent to users. Variables are replaced with actual values at send time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-primary font-medium">
              <CheckCircle2Icon className="size-4" /> Saved
            </span>
          )}
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcwIcon className="size-4 mr-2" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80">
            <SaveIcon className="size-4 mr-2" />
            {saving ? "Saving..." : "Save Templates"}
          </Button>
        </div>
      </div>

      {/* Welcome Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Welcome Email
                {config.welcomeEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <CheckCircle2Icon className="size-3" /> Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <AlertCircleIcon className="size-3" /> Disabled
                  </span>
                )}
              </CardTitle>
              <CardDescription>Sent to new users when their account is created.</CardDescription>
            </div>
            <Switch
              checked={config.welcomeEnabled}
              onCheckedChange={(c) => updateWelcome("Enabled", c)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={config.welcomeSubject}
              onChange={(e) => updateWelcome("Subject", e.target.value)}
              placeholder="Welcome to {{companyName}}"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Body (HTML)</Label>
              <div className="flex flex-wrap gap-1">
                {WELCOME_VARS.map((v) => (
                  <code key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">{v}</code>
                ))}
              </div>
            </div>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-36 grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-1"><CodeIcon className="size-3" /> Edit</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1"><EyeIcon className="size-3" /> Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={config.welcomeBody}
                  onChange={(e) => updateWelcome("Body", e.target.value)}
                  rows={14}
                  className="font-mono text-xs leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="min-h-[300px] rounded-lg border bg-white p-4 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: renderTemplate(config.welcomeBody) }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Task Assigned Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Task Assigned Email
                {config.taskAssignedEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <CheckCircle2Icon className="size-3" /> Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <AlertCircleIcon className="size-3" /> Disabled
                  </span>
                )}
              </CardTitle>
              <CardDescription>Sent when a task is assigned to a user.</CardDescription>
            </div>
            <Switch
              checked={config.taskAssignedEnabled}
              onCheckedChange={(c) => updateTask("Enabled", c)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={config.taskAssignedSubject}
              onChange={(e) => updateTask("Subject", e.target.value)}
              placeholder="New Task Assigned: {{taskTitle}}"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Body (HTML)</Label>
              <div className="flex flex-wrap gap-1">
                {TASK_VARS.map((v) => (
                  <code key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">{v}</code>
                ))}
              </div>
            </div>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-36 grid-cols-2">
                <TabsTrigger value="edit" className="flex items-center gap-1"><CodeIcon className="size-3" /> Edit</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1"><EyeIcon className="size-3" /> Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={config.taskAssignedBody}
                  onChange={(e) => updateTask("Body", e.target.value)}
                  rows={14}
                  className="font-mono text-xs leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="min-h-[300px] rounded-lg border bg-white p-4 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: renderTemplate(config.taskAssignedBody) }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
