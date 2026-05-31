"use client";

import { useState } from "react";
import { Save, Shield, Bell, Globe, Smartphone, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { toast } from "sonner";

export default function WaSettingsPage() {
  const [settings, setSettings] = useState({
    autoReconnect: true,
    storeMessages: true,
    notificationsEnabled: true,
    soundEnabled: true,
    webhookUrl: "",
    rateLimitPerMinute: "30",
    maxRetries: "3",
    sessionTimeout: "30",
    messageRetention: "90",
    language: "en",
  });

  const handleSave = () => toast.success("Settings saved");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">WhatsApp Settings</h1><p className="text-sm text-slate-500 mt-1">Configure your WhatsApp integration</p></div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700"><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><WhatsappIcon size={16} color="currentColor" /> Connection</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Auto Reconnect</Label><p className="text-xs text-slate-500">Automatically reconnect on disconnect</p></div>
                <Switch checked={settings.autoReconnect} onCheckedChange={(v) => setSettings({ ...settings, autoReconnect: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Store Messages</Label><p className="text-xs text-slate-500">Save message history in database</p></div>
                <Switch checked={settings.storeMessages} onCheckedChange={(v) => setSettings({ ...settings, storeMessages: v })} />
              </div>
              <div><Label>Session Timeout (min)</Label><Input className="w-24" value={settings.sessionTimeout} onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Localization</CardTitle></CardHeader>
            <CardContent>
              <div><Label>Language</Label>
                <select className="w-full border rounded-lg p-2 text-sm mt-1" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
                  <option value="en">English</option><option value="hi">Hindi</option><option value="es">Spanish</option><option value="pt">Portuguese</option><option value="ar">Arabic</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Push Notifications</Label><p className="text-xs text-slate-500">Browser notifications for new messages</p></div>
                <Switch checked={settings.notificationsEnabled} onCheckedChange={(v) => setSettings({ ...settings, notificationsEnabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Sound Alerts</Label><p className="text-xs text-slate-500">Play sound on new messages</p></div>
                <Switch checked={settings.soundEnabled} onCheckedChange={(v) => setSettings({ ...settings, soundEnabled: v })} />
              </div>
              <div><Label>Default Webhook URL</Label><Input placeholder="https://your-server.com/webhook" value={settings.webhookUrl} onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Rate Limit (msg/min)</Label><Input className="w-24" value={settings.rateLimitPerMinute} onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: e.target.value })} /></div>
              <div><Label>Message Retention (days)</Label><Input className="w-24" value={settings.messageRetention} onChange={(e) => setSettings({ ...settings, messageRetention: e.target.value })} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Advanced</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Max Retries</Label><Input className="w-24" value={settings.maxRetries} onChange={(e) => setSettings({ ...settings, maxRetries: e.target.value })} /></div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-xs text-amber-700"><strong>Warning:</strong> Changing advanced settings may affect message delivery.</p></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
