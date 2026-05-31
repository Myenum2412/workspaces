"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Smartphone, Play, Square, Trash2, QrCode, CheckCircle2, XCircle, Loader2, Wifi, WifiOff, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { openwaApi } from "@/lib/whatsapp/openwa-api";
import WhatsappIcon from "@/components/icons/WhatsappIcon";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; className: string }> = {
    ready: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    connected: { icon: Wifi, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    initializing: { icon: Loader2, className: "bg-blue-50 text-blue-700 border-blue-200" },
    qr_ready: { icon: QrCode, className: "bg-amber-50 text-amber-700 border-amber-200" },
    authenticating: { icon: Loader2, className: "bg-purple-50 text-purple-700 border-purple-200" },
    disconnected: { icon: WifiOff, className: "bg-red-50 text-red-700 border-red-200" },
    failed: { icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
    created: { icon: Smartphone, className: "bg-slate-50 text-slate-700 border-slate-200" },
  };
  const c = config[status] || config.created;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 ${c.className}`}>
      <Icon className={`h-3 w-3 ${c.icon === Loader2 ? "animate-spin" : ""}`} />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: sessions = [], isLoading } = useQuery({ queryKey: ["openwa-sessions"], queryFn: () => openwaApi.sessions.list() });
  const { data: stats } = useQuery({ queryKey: ["openwa-session-stats"], queryFn: () => openwaApi.sessions.stats(), refetchInterval: 10000 });

  const createMutation = useMutation({
    mutationFn: (name: string) => openwaApi.sessions.create(name),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-sessions"] }); setShowCreate(false); setNewName(""); toast.success("Session created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => openwaApi.sessions.start(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-sessions"] }); toast.success("Session starting..."); },
    onError: (err: any) => toast.error(err.message),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => openwaApi.sessions.stop(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-sessions"] }); toast.success("Session stopped"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => openwaApi.sessions.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-sessions"] }); toast.success("Session deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage multiple WhatsApp connections</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"><Plus className="h-4 w-4" />New Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create WhatsApp Session</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Session Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., sales-support" />
                <p className="text-xs text-slate-500">Alphanumeric and hyphens only</p>
              </div>
              <Button className="w-full" disabled={!newName || createMutation.isPending} onClick={() => createMutation.mutate(newName)}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-slate-500">Total Sessions</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-emerald-600">{stats.ready}</div><p className="text-xs text-slate-500">Connected</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{stats.active}</div><p className="text-xs text-slate-500">Active Engines</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{stats.disconnected}</div><p className="text-xs text-slate-500">Disconnected</p></CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : sessions.length === 0 ? (
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100"><WhatsappIcon size={32} /></div></div>
            <CardTitle>No Sessions</CardTitle>
            <CardDescription>Create a WhatsApp session to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Create First Session</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session: any) => (
            <Card key={session._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100"><WhatsappIcon size={24} /></div>
                    <div>
                      <div className="flex items-center gap-2"><h3 className="font-semibold">{session.name}</h3><StatusBadge status={session.status} /></div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {session.phone && <span>📱 {session.phone}</span>}
                        {session.connectedAt && <span>Connected {new Date(session.connectedAt).toLocaleDateString()}</span>}
                        <span className="text-slate-400">{session._id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!["ready", "initializing", "authenticating"].includes(session.status) ? (
                      <Button size="sm" variant="outline" onClick={() => startMutation.mutate(session._id)} disabled={startMutation.isPending}><Play className="h-3.5 w-3.5 mr-1" /> Start</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => stopMutation.mutate(session._id)} disabled={stopMutation.isPending}><Square className="h-3.5 w-3.5 mr-1" /> Stop</Button>
                    )}
                    {session.status === "qr_ready" && (
                      <Button size="sm" variant="outline" asChild><Link href={`/workspace/whatsapp/qr?session=${session._id}`}><QrCode className="h-3.5 w-3.5 mr-1" /> QR</Link></Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => { if (confirm("Delete session?")) deleteMutation.mutate(session._id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
