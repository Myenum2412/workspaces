"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, AlertTriangle, Info, AlertCircle, Filter } from "lucide-react";
import { auditApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const severityConfig: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  warn: { icon: AlertTriangle, color: "text-amber-500" },
  error: { icon: AlertCircle, color: "text-red-500" },
};

export default function LogsPage() {
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", severity, page],
    queryFn: () => auditApi.list({ severity: severity || undefined, page, limit: 50 }),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1><p className="text-sm text-slate-500 mt-1">{total} events</p></div>
        <div className="flex gap-2">
          {["", "info", "warn", "error"].map((s) => (
            <Badge key={s} variant={severity === s ? "default" : "outline"} className="cursor-pointer" onClick={() => { setSeverity(s); setPage(1); }}>
              {s || "All"}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {isLoading ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-40" /></div>
              </div>
            )) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <History className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">No activity logs</p>
              </div>
            ) : logs.map((log: any) => {
              const cfg = severityConfig[log.severity] || severityConfig.info;
              const SevIcon = cfg.icon;
              return (
                <div key={log._id} className="flex items-start gap-4 p-4 border-b hover:bg-slate-50">
                  <SevIcon className={`h-5 w-5 mt-0.5 ${cfg.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{log.action}</span>
                      <Badge variant="outline" className="text-[10px]">{log.severity}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.userEmail || log.userId || "System"}
                      {log.path && ` • ${log.method} ${log.path}`}
                      {log.errorMessage && ` • ${log.errorMessage}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="cursor-pointer" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Badge>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Badge variant="outline" className="cursor-pointer" onClick={() => setPage(p => p + 1)}>Next</Badge>
        </div>
      )}
    </div>
  );
}
