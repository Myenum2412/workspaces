"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tag, Trash2 } from "lucide-react";
import { labelsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function LabelsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["labels"], queryFn: () => labelsApi.list() });
  const labels = data?.labels || [];
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#6366f1" });

  const handleCreate = async () => {
    try { await labelsApi.create(form); toast.success("Created"); setShowDialog(false); queryClient.invalidateQueries({ queryKey: ["labels"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete label?")) return;
    try { await labelsApi.delete(id); toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["labels"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Labels</h1><p className="text-sm text-slate-500 mt-1">Organize contacts with labels</p></div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4" /> New Label</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labels.map((l: any) => (
          <Card key={l._id}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: l.color }} />
                <CardTitle className="text-base">{l.name}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(l._id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Label</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Color</label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-16 h-10" /></div>
            <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
