"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, Crown, SearchIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrgAuth } from "../auth-context";
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
    if (r === "ceo" || r === "owner") return <Badge className="bg-[#40D1C5]/20 text-[#0F1A18] border-[#40D1C5]/30 capitalize hover:bg-[#40D1C5]/30"><Crown className="mr-1 h-3 w-3" />{role}</Badge>;
    if (r === "admin") return <Badge variant="outline" className="bg-[#3FACAE]/10 text-[#244E4B] border-[#3FACAE]/30 capitalize">{role}</Badge>;
    return <Badge variant="outline" className="border-[#BDCFC5] text-[#0F1A18] capitalize">{role}</Badge>;
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1A18]">Executive Management</h1>
        <p className="text-sm text-[#8F9792] mt-1">View and manage C-level executives and organization owners.</p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="border-b border-[#BDCFC5]/30 bg-[#244E4B] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">CEO & Executive Table</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#40D1C5] px-2 text-xs font-bold text-[#0F1A18] shadow-sm">{total}</span>
              </div>
              <p className="hidden text-xs text-[#BDCFC5] xl:block">CEO, Owner, and Admin members of your organization.</p>
            </div>
            <div className="relative flex-1 px-4 lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-[#8F9792]" />
              <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search executives..." className="h-12 bg-white/80 border-[#BDCFC5]/40 pl-12 text-[#0F1A18] focus-visible:ring-[#3FACAE] placeholder:text-[#8F9792]" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-hidden rounded-xl border border-[#BDCFC5]/40 bg-white/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0F1A18] hover:bg-[#0F1A18] border-b-0">
                  <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4]">Executive</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4]">Role</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4]">Status</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4]">Department</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4]">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map(({ profile, member }) => (
                  <TableRow key={profile.id} className="transition-colors even:bg-[#BDCFC5]/10 odd:bg-transparent hover:bg-[#40D1C5]/10 border-b border-[#BDCFC5]/30">
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3FACAE]/20 text-sm font-bold text-[#244E4B]">{profile.firstName?.[0] ?? "?"}{profile.lastName?.[0] ?? ""}</div>
                        <div className="flex flex-col"><span className="font-bold text-[#0F1A18]">{profile.firstName} {profile.lastName}</span><span className="text-xs text-[#8F9792]">{profile.email}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">{getRoleBadge(member.role)}</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline" className={member.status === "active" ? "bg-[#40D1C5]/10 text-[#35848D] border-[#40D1C5]/40" : member.status === "suspended" ? "bg-[#35848D]/10 text-[#35848D] border-[#35848D]/40" : "bg-[#8F9792]/10 text-[#8F9792] border-[#8F9792]/30"}>{member.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-[#8F9792]">{profile.department ?? "—"}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-[#8F9792]">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("en-IN") : "—"}</TableCell>
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
