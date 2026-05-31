"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Bot, Trash2, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import { automationApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const emptyRule = { name: "", description: "", triggerType: "keyword", triggerConfig: {}, conditions: [], actions: [] };

export default function AutomationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["automation"], queryFn: () => automationApi.list() });
  const rules = data?.rules || [];
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyRule);

  const openCreate = () => { setEditing(null); setForm(emptyRule); setShowDialog(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ name: r.name, description: r.description, triggerType: r.triggerType, triggerConfig: r.triggerConfig, conditions: r.conditions, actions: r.actions }); setShowDialog(true); };

  const handleSave = async () => {
    try {
      if (editing) { await automationApi.update(editing._id, form); toast.success("Updated"); }
      else { await automationApi.create(form); toast.success("Created"); }
      setShowDialog(false); queryClient.invalidateQueries({ queryKey: ["automation"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggle = async (id: string) => {
    try { await automationApi.toggle(id); queryClient.invalidateQueries({ queryKey: ["automation"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete rule?")) return;
    try { await automationApi.delete(id); toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["automation"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Automation</h1><p className="text-sm text-slate-500 mt-1">Auto-reply rules and triggers</p></div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Rule</Button>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">Loading...</p> :
        rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bot className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-sm font-medium">No automation rules</p>
            <p className="text-xs mt-1">Create rules for auto-reply, keyword triggers</p>
          </div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r: any) => (
            <Card key={r._id}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">{r.description}</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{r.triggerType}</Badge>
                    {r.isActive ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleToggle(r._id)}>
                    {r.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Zap className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r._id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Executed {r.executionCount || 0} times</p>
                {r.lastExecutedAt && <p className="text-[10px] text-slate-400">Last: {new Date(r.lastExecutedAt).toLocaleString()}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      }

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Rule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Trigger</Label>
              <select className="w-full border rounded-lg p-2 text-sm" value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}>
                <option value="keyword">Keyword</option><option value="incoming_message">Incoming Message</option><option value="schedule">Schedule</option><option value="event">Event</option><option value="no_reply">No Reply</option>
              </select>
            </div>
            <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
