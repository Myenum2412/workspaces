"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Webhook, Trash2, Play, CheckCircle2, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { openwaApi } from "@/lib/whatsapp/openwa-api";

const WEBHOOK_EVENTS = ["message.received", "message.sent", "message.ack", "message.revoked", "session.status", "session.qr", "session.authenticated", "session.disconnected", "group.join", "group.leave", "group.update"] as const;

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string>("default");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ url: "", events: ["message.received"] as string[], secret: "", retryCount: 3 });

  const { data: sessions = [] } = useQuery({ queryKey: ["openwa-sessions"], queryFn: () => openwaApi.sessions.list() });
  const { data: webhooks = [], isLoading, refetch } = useQuery({
    queryKey: ["openwa-webhooks", selectedSession],
    queryFn: () => openwaApi.webhooks.list(selectedSession),
    enabled: !!selectedSession,
  });

  const createMutation = useMutation({
    mutationFn: () => openwaApi.webhooks.create(selectedSession, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-webhooks"] }); setShowCreate(false); toast.success("Webhook created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => openwaApi.webhooks.delete(id),
    onSuccess: () => { refetch(); toast.success("Webhook deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => openwaApi.webhooks.test(id),
    onSuccess: (data) => toast.success(data.success ? "Test delivered!" : `Failed: ${data.error || data.statusCode}`),
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (webhook: any) => openwaApi.webhooks.update(webhook._id, { active: !webhook.active }),
    onSuccess: () => refetch(),
  });

  const copyPayloadExample = () => {
    const example = JSON.stringify({ event: "message.received", timestamp: new Date().toISOString(), sessionId: "...", data: { from: "91xxx@s.whatsapp.net", body: "Hello" }, idempotencyKey: "uuid", deliveryId: "uuid" }, null, 2);
    navigator.clipboard.writeText(example);
    toast.success("Copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Webhooks</h1><p className="text-sm text-slate-500 mt-1">Real-time event notifications</p></div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Add Webhook</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : webhooks.length === 0 ? (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <Webhook className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <CardTitle>No webhooks configured</CardTitle>
            <CardDescription>Receive events via HTTP POST with HMAC signatures</CardDescription>
          </CardHeader>
          <CardContent><Button className="w-full" onClick={() => setShowCreate(true)}>Create First Webhook</Button></CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((wh: any) => (
            <Card key={wh._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Webhook className="h-5 w-5 text-slate-400" />
                    <div>
                      <CardTitle className="text-base font-mono text-xs truncate max-w-md">{wh.url}</CardTitle>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(wh.events || []).map((e: string) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={wh.active} onCheckedChange={() => toggleMutation.mutate(wh)} />
                    <Button size="sm" variant="outline" onClick={() => testMutation.mutate(wh._id)} disabled={testMutation.isPending}><Play className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(wh._id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Retries: {wh.retryCount}</span>
                  {wh.lastTriggeredAt && <span>Last: {new Date(wh.lastTriggeredAt).toLocaleString()}</span>}
                  {wh.secret && <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Signed</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://your-server.com/webhook" /></div>
            <div><Label>Secret (for HMAC-SHA256 signature)</Label><Input value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="optional" /></div>
            <div>
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {WEBHOOK_EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.events.includes(event)} onChange={(e) => {
                      setForm({ ...form, events: e.target.checked ? [...form.events, event] : form.events.filter(ev => ev !== event) });
                    }} className="rounded" />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2"><Label className="text-xs">Payload Example</Label><Button size="sm" variant="ghost" onClick={copyPayloadExample}><Copy className="h-3 w-3" /></Button></div>
              <pre className="text-[10px] text-slate-500 overflow-x-auto">{JSON.stringify({ event: "message.received", timestamp: "2026-01-01T00:00:00Z", sessionId: "...", data: {} }, null, 2)}</pre>
            </div>
            <Button className="w-full" disabled={!form.url || form.events.length === 0} onClick={() => createMutation.mutate()}>Create Webhook</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
