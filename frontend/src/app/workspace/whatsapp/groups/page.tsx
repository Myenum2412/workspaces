"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, UserPlus, Crown, Shield, Trash2, LogOut, Link2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { openwaApi } from "@/lib/whatsapp/openwa-api";

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string>("default");
  const [showCreate, setShowCreate] = useState(false);
  const [showInfo, setShowInfo] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newParticipants, setNewParticipants] = useState("");

  const { data: sessions = [] } = useQuery({ queryKey: ["openwa-sessions"], queryFn: () => openwaApi.sessions.list() });
  const { data: groups = [], isLoading, refetch } = useQuery({
    queryKey: ["openwa-groups", selectedSession],
    queryFn: () => openwaApi.groups.list(selectedSession),
    enabled: !!selectedSession,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const participants = newParticipants.split(",").map(p => p.trim()).filter(Boolean);
      return openwaApi.groups.create(selectedSession, newGroupName, participants);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["openwa-groups"] }); setShowCreate(false); setNewGroupName(""); setNewParticipants(""); toast.success("Group created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => openwaApi.groups.leave(selectedSession, groupId),
    onSuccess: () => { refetch(); toast.success("Left group"); },
    onError: (err: any) => toast.error(err.message),
  });

  const inviteCodeMutation = useMutation({
    mutationFn: (groupId: string) => openwaApi.groups.inviteCode(selectedSession, groupId),
    onSuccess: (data) => { toast.success(`Invite link: ${data.inviteLink}`); navigator.clipboard.writeText(data.inviteLink); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">WhatsApp Groups</h1><p className="text-sm text-slate-500 mt-1">Manage group conversations</p></div>
        <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> Create Group</Button>
      </div>

      {/* Session Selector */}
      {sessions.length > 1 && (
        <div className="flex gap-2">
          {sessions.map((s: any) => (
            <Button key={s._id} variant={selectedSession === s._id ? "default" : "outline"} size="sm" onClick={() => setSelectedSession(s._id)}>{s.name}</Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading groups...</p>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400"><Users className="h-16 w-16 mb-4 opacity-30" /><p className="text-sm font-medium">No groups found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group: any) => (
            <Card key={group.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <Badge variant="outline">{group.participantsCount || group.participants?.length || 0} members</Badge>
                </div>
                {group.isAdmin && <Badge className="bg-amber-50 text-amber-700 border-amber-200 w-fit mt-1"><Crown className="h-3 w-3 mr-1" />Admin</Badge>}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openwaApi.groups.get(selectedSession, group.id).then(setShowInfo).catch(() => {})}>
                    <Shield className="h-3.5 w-3.5 mr-1" /> Info
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => inviteCodeMutation.mutate(group.id)} disabled={inviteCodeMutation.isPending}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Invite
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => { if (confirm("Leave this group?")) leaveMutation.mutate(group.id); }}>
                    <LogOut className="h-3.5 w-3.5" /> Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create WhatsApp Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Group Name</Label><Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Sales Team" /></div>
            <div><Label>Participants (comma-separated)</Label><Input value={newParticipants} onChange={(e) => setNewParticipants(e.target.value)} placeholder="9199xxx, 9188xxx" /></div>
            <Button className="w-full" disabled={!newGroupName || createMutation.isPending} onClick={() => createMutation.mutate()}>Create Group</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Info Dialog */}
      {showInfo && (
        <Dialog open={!!showInfo} onOpenChange={() => setShowInfo(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{showInfo.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {showInfo.description && <p className="text-sm text-slate-500">{showInfo.description}</p>}
              <div className="flex items-center gap-2"><Badge>{showInfo.participants?.length || 0} members</Badge></div>
              <ScrollArea className="h-64">
                {(showInfo.participants || []).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">{p.number?.[0]}</div>
                      <span className="text-sm">{p.number}</span>
                    </div>
                    {p.isSuperAdmin && <Badge className="bg-amber-50 text-amber-700">Owner</Badge>}
                    {p.isAdmin && !p.isSuperAdmin && <Badge variant="outline">Admin</Badge>}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
