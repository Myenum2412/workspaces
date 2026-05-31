"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Square, Clock, CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { openwaApi } from "@/lib/whatsapp/openwa-api";

export default function BulkPage() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string>("default");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [delay, setDelay] = useState("2000");

  const { data: sessions = [] } = useQuery({ queryKey: ["openwa-sessions"], queryFn: () => openwaApi.sessions.list() });
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["openwa-batches", selectedSession],
    queryFn: () => openwaApi.messages.list(selectedSession).then(() => []),
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const lines = recipients.split("\n").filter((l) => l.trim());
      if (!lines.length || !message.trim()) throw new Error("Recipients and message required");
      const msgs = lines.map((l) => ({ chatId: l.trim(), type: "text", content: { text: message } }));
      return openwaApi.messages.sendBulk(selectedSession, { messages: msgs, options: { delayBetweenMessages: parseInt(delay), randomizeDelay: true, stopOnError: false } });
    },
    onSuccess: (data) => {
      toast.success(`Bulk job ${data.batchId} created`);
      queryClient.invalidateQueries({ queryKey: ["openwa-batches"] });
      setRecipients(""); setMessage("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (batchId: string) => openwaApi.messages.cancelBatch(selectedSession, batchId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-batches"] }); toast.success("Cancelled"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Bulk Messaging</h1><p className="text-sm text-slate-500 mt-1">Send messages to multiple recipients</p></div>
      </div>

      <Tabs defaultValue="create">
        <TabsList><TabsTrigger value="create">Create Job</TabsTrigger><TabsTrigger value="history">Job History</TabsTrigger></TabsList>
        <TabsContent value="create" className="mt-4 space-y-4">
          {sessions.length > 1 && (
            <div className="flex gap-2">{sessions.map((s: any) => (
              <Button key={s._id} variant={selectedSession === s._id ? "default" : "outline"} size="sm" onClick={() => setSelectedSession(s._id)}>{s.name}</Button>
            ))}</div>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">New Bulk Job</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipients (one per line)</label>
                <textarea className="w-full h-32 p-3 text-sm border rounded-lg font-mono" placeholder={"919876543210@s.whatsapp.net\n918765432109@s.whatsapp.net\n+919876543210"} value={recipients} onChange={(e) => setRecipients(e.target.value)} />
                <p className="text-[10px] text-slate-400 mt-1">Use JID format or phone numbers</p>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea className="w-full h-24 p-3 text-sm border rounded-lg" placeholder="Hi {name}! Check out our latest offers..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <p className="text-[10px] text-slate-400 mt-1">Use {'{name}'} for variable substitution</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Delay (ms)</label><Input type="number" value={delay} onChange={(e) => setDelay(e.target.value)} /></div>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!recipients || !message || createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Start Bulk Send
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400"><FileText className="h-16 w-16 mb-4 opacity-30" /><p className="text-sm font-medium">No bulk jobs yet</p></div>
          ) : (
            <div className="space-y-4">
              {(jobs as any[]).map((j: any) => (
                <Card key={j.batchId}>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{j.batchId}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={j.status === "completed" ? "default" : j.status === "processing" ? "secondary" : "outline"}>{j.status}</Badge>
                      </div>
                    </div>
                    {j.status === "processing" && (
                      <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(j.batchId)}><Square className="h-3 w-3 mr-1" /> Cancel</Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-xs">
                      <span>Total: {j.progress?.total || 0}</span>
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sent: {j.progress?.sent || 0}</span>
                      <span className="text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed: {j.progress?.failed || 0}</span>
                      <span className="text-blue-600 flex items-center gap-1"><Clock className="h-3 w-3" /> Pending: {j.progress?.pending || 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${((j.progress?.sent || 0) + (j.progress?.failed || 0)) / Math.max(j.progress?.total || 1, 1) * 100}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
