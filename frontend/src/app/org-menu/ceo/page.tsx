"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, Crown, SearchIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrgAuth } from "../layout";
import { api } from "@/lib/api/client";
import type { OrgMember, UserProfile } from "@/types";

const CEO_ROLES = ["ceo", "owner", "admin"];
const pageSizeOptions = [5, 10, 20];

interface CeoRow { profile: UserProfile; member: OrgMember }

export default function CeoPage() {
  const { session } = useOrgAuth();
  const orgId = session?.organization?.id;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; members: any[] }>("/api/members");
        return res.members as OrgMember[];
      } catch { return []; }
    },
    enabled: !!orgId,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["org-profiles", orgId],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: UserProfile[] }>("/api/members"); // returns employees
        return res.data;
      } catch { return []; }
    },
    enabled: !!orgId,
  });

  const ceoRows: CeoRow[] = React.useMemo(() => {
    return members
      .filter((m) => CEO_ROLES.includes((m.role ?? "").toLowerCase()))
      .map((member) => {
        const profile = profiles.find((p) => p.userId === member.userId);
        return profile ? { profile, member } : null;
      })
      .filter((row): row is CeoRow => row !== null);
  }, [members, profiles]);

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return ceoRows;
    return ceoRows.filter((row) =>
      `${row.profile.firstName} ${row.profile.lastName} ${row.profile.email} ${row.member.role}`.toLowerCase().includes(query)
    );
  }, [ceoRows, searchQuery]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === "ceo" || r === "owner") return <Badge className="bg-amber-100 text-amber-800 border-amber-300 capitalize"><Crown className="mr-1 h-3 w-3" />{role}</Badge>;
    if (r === "admin") return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">{role}</Badge>;
    return <Badge variant="outline" className="capitalize">{role}</Badge>;
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Management</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage C-level executives and organization owners.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="border-b bg-amber-50/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-amber-950">CEO & Executive Table</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-bold text-slate-900">{total}</span>
              </div>
              <p className="hidden text-xs text-slate-900/75 xl:block">CEO, Owner, and Admin members of your organization.</p>
            </div>
            <div className="relative flex-1 px-4 lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search executives..." className="h-12 bg-background pl-12 focus-visible:ring-amber-500" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-hidden rounded-xl border bg-background/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50/70 hover:bg-amber-50/70">
                  <TableHead className="px-4 py-4 font-semibold text-amber-950">Executive</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-amber-950">Role</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-amber-950">Status</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-amber-950">Department</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-amber-950">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map(({ profile, member }) => (
                  <TableRow key={profile.id} className="transition-colors hover:bg-amber-50/30">
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">{profile.firstName?.[0] ?? "?"}{profile.lastName?.[0] ?? ""}</div>
                        <div className="flex flex-col"><span className="font-bold text-amber-950">{profile.firstName} {profile.lastName}</span><span className="text-xs text-muted-foreground">{profile.email}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline" className={member.status === "active" ? "bg-primary/5 text-primary border-emerald-200" : member.status === "suspended" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}>{member.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-600">{profile.department ?? "—"}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-500">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("en-IN") : "—"}</TableCell>
                  </TableRow>
                ))}
                {paginatedRows.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center"><Users className="h-10 w-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">{searchQuery ? "No executives match your search." : "No CEO or executive members found."}</p></TableCell></TableRow>
                )}
                {isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center"><p className="text-sm text-slate-400">Loading...</p></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">Showing {total === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, total)} of {total} executives</p>
            <div className="flex items-center gap-4">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none">{pageSizeOptions.map((o) => (<option key={o} value={o}>{o} per page</option>))}</select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeftIcon className="size-4" /></Button>
                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRightIcon className="size-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
