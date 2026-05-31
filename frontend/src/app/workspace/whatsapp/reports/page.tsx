"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, MessageCircle, CheckCircle2, Clock, Users, Megaphone, TrendingUp, TrendingDown, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { openwaApi } from "@/lib/whatsapp/openwa-api";

function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}><Icon className="h-6 w-6" /></div>
        <div className="flex-1">
          <p className="text-2xl font-bold">{value}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500">{title}</p>
            {trend !== undefined && (
              <span className={`text-[10px] flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");

  const { data: overview, isLoading: loadingOverview } = useQuery({ queryKey: ["openwa-stats-overview"], queryFn: () => openwaApi.stats.overview(), refetchInterval: 30000 });
  const { data: msgStats, isLoading: loadingMsg } = useQuery({ queryKey: ["openwa-stats-messages", period], queryFn: () => openwaApi.stats.messages(period), refetchInterval: 30000 });

  const loading = loadingOverview || loadingMsg;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1><p className="text-sm text-slate-500 mt-1">WhatsApp messaging performance</p></div>
        <div className="flex gap-1">
          {(["24h", "7d", "30d"] as const).map(p => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Messages Sent" value={overview?.messages?.sent || 0} icon={MessageCircle} color="bg-blue-100 text-blue-600" trend={12} />
          <StatCard title="Messages Received" value={overview?.messages?.received || 0} icon={MessageCircle} color="bg-emerald-100 text-emerald-600" trend={8} />
          <StatCard title="Failed" value={overview?.messages?.failed || 0} icon={Clock} color="bg-red-100 text-red-600" trend={-3} />
          <StatCard title="Active Sessions" value={overview?.sessions?.active || 0} icon={Wifi} color="bg-purple-100 text-purple-600" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Series Chart */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Message Volume ({period})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {(msgStats?.timeSeries || []).slice(-14).map((point: any, i: number) => {
                const total = (point.sent || 0) + (point.received || 0);
                const maxTotal = Math.max(...(msgStats?.timeSeries || []).map((p: any) => (p.sent || 0) + (p.received || 0)), 1);
                const height = Math.max((total / maxTotal) * 100, 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: `${height}%` }}>
                      <div className="bg-emerald-500 rounded-t-sm flex-1" style={{ height: `${(point.sent / Math.max(total, 1)) * 100}%` }} title={`Sent: ${point.sent}`} />
                      <div className="bg-blue-400 rounded-b-sm flex-1" style={{ height: `${(point.received / Math.max(total, 1)) * 100}%` }} title={`Received: ${point.received}`} />
                    </div>
                    <span className="text-[8px] text-slate-400">{point.timestamp?.slice(-2) || i}</span>
                  </div>
                );
              })}
              {(!msgStats?.timeSeries || msgStats.timeSeries.length === 0) && (
                <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">No data for this period</div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Sent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" /> Received</span>
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader><CardTitle className="text-base">Messages by Type</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(msgStats?.byType || {}).map(([type, count]: [string, any]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(msgStats?.byType || {}).length === 0 && <p className="text-sm text-slate-400">No data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Top Chats */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Chats</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(msgStats?.topChats || []).slice(0, 5).map((chat: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[200px]">{chat.chatId?.split("@")[0]}</span>
                  <Badge variant="secondary">{chat.messageCount}</Badge>
                </div>
              ))}
              {(!msgStats?.topChats || msgStats.topChats.length === 0) && <p className="text-sm text-slate-400">No data</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Stats Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Session Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2">Session</th><th className="pb-2">Sent</th><th className="pb-2">Received</th>
              </tr></thead>
              <tbody>
                {(msgStats?.bySession || []).map((s: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-emerald-600">{s.sent}</td>
                    <td className="py-2 text-blue-600">{s.received}</td>
                  </tr>
                ))}
                {(!msgStats?.bySession || msgStats.bySession.length === 0) && (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400">No session data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
