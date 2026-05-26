"use client"

import * as React from "react"
import { MasterDataManagement } from "./master-data-management"
import { EmailTemplates } from "./email-templates"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings2, Database, Shield, Bell, MailIcon } from "lucide-react"

function parseSettings(settings?: string | null): Record<string, any> {
  if (!settings) return {}
  try {
    const parsed = JSON.parse(settings)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export default function OrgSettingsPage() {
  const [activeTab, setActiveTab] = React.useState("master-data")
  const [settings, setSettings] = React.useState<Record<string, any>>({})
  const org = { id: "local", name: "Organization" }

  React.useEffect(() => {
    const raw = localStorage.getItem("org-settings")
    setSettings(parseSettings(raw))
  }, [])

  return (
    <section className="space-y-6">
      <Card className="border bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight text-emerald-950">
            Organization Settings
          </CardTitle>
          <CardDescription>
            Configure organization-wide preferences, master data, and policies.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="flex items-center justify-between border-b pb-1">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                {[
                  { id: "general", label: "General", icon: Settings2 },
                  { id: "master-data", label: "Master Data", icon: Database },
                  { id: "email-templates", label: "Email Templates", icon: MailIcon },
                  { id: "security", label: "Security", icon: Shield },
                  { id: "notifications", label: "Notifications", icon: Bell },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-emerald-600 border-b-2 border-transparent rounded-none px-0 py-3 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-slate-700 flex items-center gap-2 transition-all"
                  >
                    <tab.icon className="size-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="general">
              <div className="grid gap-6">
                <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center py-20 bg-slate-50/50">
                  <Settings2 className="size-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">General Organization Settings</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Organization branding, timezone, and fundamental configuration options.</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="master-data" className="border-none p-0 outline-none">
              <MasterDataManagement orgSettings={settings} />
            </TabsContent>

            <TabsContent value="email-templates" className="border-none p-0 outline-none">
              <EmailTemplates />
            </TabsContent>

            <TabsContent value="security">
              <div className="grid gap-6">
                <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center py-20 bg-slate-50/50">
                  <Shield className="size-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900">Security & Permissions</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Configure role-based access control, 2FA, and audit logs.</p>
                </Card>
              </div>
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
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
