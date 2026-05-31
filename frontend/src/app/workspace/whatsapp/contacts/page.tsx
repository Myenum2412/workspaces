"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserCircle, ShieldOff, ShieldCheck, Trash2, Upload, MoreVertical } from "lucide-react";
import { contactsApi } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", search, page],
    queryFn: () => contactsApi.list({ search, page, limit: 50 }),
  });

  const handleBlock = async (id: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await contactsApi.unblock(id);
        toast.success("Contact unblocked");
      } else {
        await contactsApi.block(id);
        toast.success("Contact blocked");
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await contactsApi.delete(id);
      toast.success("Contact deleted");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImport = async () => {
    try {
      const contacts = JSON.parse(importText);
      if (!Array.isArray(contacts)) throw new Error("Expected JSON array");
      const result = await contactsApi.import(contacts);
      toast.success(`Imported: ${result.upserted} new, ${result.modified} updated`);
      setShowImport(false);
      setImportText("");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (e: any) {
      toast.error(e.message || "Invalid JSON");
    }
  };

  const contacts = data?.contacts || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">{total} contacts</p>
        </div>
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="h-4 w-4" /> Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Contacts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                className="w-full h-48 p-3 text-sm border rounded-lg font-mono"
                placeholder='[{"waContactId": "91xxx@s.whatsapp.net", "name": "John", "phone": "91xxx"}]'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <Button onClick={handleImport} className="w-full">Import</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search contacts..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <UserCircle className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-sm font-medium">No contacts found</p>
                <p className="text-xs mt-1">Connect WhatsApp or import contacts</p>
              </div>
            ) : (
              contacts.map((contact: any) => (
                <div
                  key={contact._id}
                  className="flex items-center gap-4 p-4 border-b hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0">
                    {(contact.name || contact.pushName || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {contact.name || contact.pushName || contact.waContactId?.split("@")[0]}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{contact.waContactId}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      contact.isBlocked
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }
                  >
                    {contact.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBlock(contact._id, contact.isBlocked)}>
                        {contact.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        {contact.isBlocked ? "Unblock" : "Block"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(contact._id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {total > 50 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
