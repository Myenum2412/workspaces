"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileText, Trash2, Edit } from "lucide-react";
import { templatesApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const emptyTemplate = { name: "", category: "marketing", language: "en", body: "", variables: [] as string[] };

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyTemplate);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["templates", search],
    queryFn: () => templatesApi.list({ search }),
  });

  const templates = data?.templates || [];

  const openCreate = () => { setEditing(null); setForm(emptyTemplate); setShowDialog(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name, category: t.category, language: t.language, body: t.body, variables: t.variables }); setShowDialog(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await templatesApi.update(editing._id, form);
        toast.success("Template updated");
      } else {
        await templatesApi.create(form);
        toast.success("Template created");
      }
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try { await templatesApi.delete(id); toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["templates"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Message Templates</h1>
          <p className="text-sm text-slate-500 mt-1">{templates.length} templates</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search templates..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />) :
          templates.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400">
              <FileText className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-sm font-medium">No templates yet</p>
              <p className="text-xs mt-1">Create message templates for campaigns</p>
              <Button onClick={openCreate} variant="outline" className="mt-4">Create Template</Button>
            </div>
          ) :
          templates.map((t: any) => (
            <Card key={t._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.language}</Badge>
                    {t.isActive && <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t._id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 line-clamp-3">{t.body}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category</Label>
                <select className="w-full border rounded-lg p-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="marketing">Marketing</option><option value="utility">Utility</option><option value="authentication">Authentication</option>
                </select>
              </div>
              <div><Label>Language</Label><Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
            </div>
            <div><Label>Body</Label>
              <textarea className="w-full h-32 p-3 text-sm border rounded-lg" placeholder="Hi {{1}}, your order {{2}} is ready!" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <p className="text-[10px] text-slate-500 mt-1">Use {"{{1}}"}, {"{{2}}"} for variables</p>
            </div>
            <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
