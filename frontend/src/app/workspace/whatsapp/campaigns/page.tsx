"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, BarChart3, Trash2, Megaphone, Clock, CheckCircle2 } from "lucide-react";
import { campaignsApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Megaphone },
  scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  running: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Play },
  paused: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Pause },
  completed: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: CheckCircle2 },
  cancelled: { color: "bg-red-50 text-red-700 border-red-200", icon: Trash2 },
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list(),
  });
  const campaigns = data?.campaigns || [];

  const handleExecute = async (id: string) => {
    try { await campaignsApi.execute(id); toast.success("Campaign started"); queryClient.invalidateQueries({ queryKey: ["campaigns"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const handlePause = async (id: string) => {
    try { await campaignsApi.pause(id); toast.success("Paused"); queryClient.invalidateQueries({ queryKey: ["campaigns"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete campaign?")) return;
    try { await campaignsApi.delete(id); toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["campaigns"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">WhatsApp marketing campaigns</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />) :
        campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Megaphone className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-sm font-medium">No campaigns yet</p>
            <p className="text-xs mt-1">Create a campaign to send bulk messages</p>
          </div>
        ) : campaigns.map((c: any) => {
          const cfg = statusConfig[c.status] || statusConfig.draft;
          const progress = c.stats?.total ? Math.round(((c.stats.sent + c.stats.failed) / c.stats.total) * 100) : 0;
          return (
            <Card key={c._id}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">{c.description || "No description"}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={cfg.color}>{c.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{c.audienceType?.replace("_", " ")}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  {c.status === "draft" && <Button size="sm" variant="outline" onClick={() => handleExecute(c._id)}><Play className="h-3 w-3" /> Start</Button>}
                  {c.status === "running" && <Button size="sm" variant="outline" onClick={() => handlePause(c._id)}><Pause className="h-3 w-3" /> Pause</Button>}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(c._id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                {c.stats?.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Progress: {c.stats.sent + c.stats.failed}/{c.stats.total}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-emerald-600">Sent: {c.stats.sent || 0}</span>
                      <span className="text-blue-600">Delivered: {c.stats.delivered || 0}</span>
                      <span className="text-purple-600">Read: {c.stats.read || 0}</span>
                      <span className="text-red-600">Failed: {c.stats.failed || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      }
    </div>
  );
}
