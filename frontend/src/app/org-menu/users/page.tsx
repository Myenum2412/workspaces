"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronDownIcon,
  ChevronLeftIcon, ChevronRightIcon, FilterIcon, MoreHorizontalIcon,
  SearchIcon, RefreshCw, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useOrgAuth } from "../layout";
import { api } from "@/lib/api/client";
import type { OrgMember, UserProfile } from "@/types";
import { AddUserDialog } from "./add-user-dialog";
import { UserDetailModal } from "./user-detail-modal";
import { DeleteUserDialog } from "./delete-user-dialog";

const pageSizeOptions = [5, 10, 20, 50];

interface UserRow {
  profile: UserProfile & { id: string };
  member: OrgMember | undefined;
}

export default function OrgUsersPage() {
  const { session } = useOrgAuth();
  const queryClient = useQueryClient();
  const orgId = session?.organization?.id;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

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
        const res = await api.get<{ success: boolean; data: UserProfile[] }>("/api/staff");
        return res.data;
      } catch { return []; }
    },
    enabled: !!orgId,
  });

  const data: UserRow[] = React.useMemo(
    () => profiles.map((profile) => ({
      profile: { ...profile, id: profile.id },
      member: members.find((m) => m.userId === profile.userId),
    })),
    [profiles, members]
  );

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    else if (sortConfig.key === key && sortConfig.direction === "desc") direction = null;
    setSortConfig({ key, direction });
  };

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = data;
    if (filterStatus !== "all") result = result.filter((row) => (row.member?.status ?? "pending") === filterStatus);
    if (!query) return result;
    return result.filter((row) =>
      `${row.profile.firstName} ${row.profile.lastName} ${row.profile.email} ${row.member?.role ?? ""}`.toLowerCase().includes(query)
    );
  }, [data, filterStatus, searchQuery]);

  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let aValue: string, bValue: string;
      switch (sortConfig.key) {
        case "name": aValue = `${a.profile.firstName} ${a.profile.lastName}`; bValue = `${b.profile.firstName} ${b.profile.lastName}`; break;
        case "role": aValue = a.member?.role ?? ""; bValue = b.member?.role ?? ""; break;
        case "status": aValue = a.member?.status ?? ""; bValue = b.member?.status ?? ""; break;
        case "joined": aValue = a.member?.joinedAt ?? ""; bValue = b.member?.joinedAt ?? ""; break;
        default: aValue = ""; bValue = "";
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const toggleAll = () => {
    if (selectedIds.size === paginatedRows.length && paginatedRows.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedRows.map((row) => row.profile.id)));
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
    queryClient.invalidateQueries({ queryKey: ["org-profiles", orgId] });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDownIcon className="size-3.5 opacity-30" />;
    if (sortConfig.direction === "asc") return <ArrowUpIcon className="size-3.5 text-slate-600" />;
    if (sortConfig.direction === "desc") return <ArrowDownIcon className="size-3.5 text-slate-600" />;
    return <ArrowUpDownIcon className="size-3.5 opacity-30" />;
  };

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-background">
        <div className="border-b bg-emerald-50/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-emerald-950">User Management</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-slate-900">{total}</span>
              </div>
              <p className="hidden text-xs text-slate-900/75 xl:block">Manage organization members, roles, and access.</p>
            </div>
            <div className="relative flex-1 px-4 lg:max-w-2xl">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search by name, email..." className="h-12 bg-background pl-12 focus-visible:ring-emerald-500" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100">
                    <FilterIcon className="mr-2 size-4" />Status: {filterStatus === "all" ? "All" : filterStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["all", "active", "pending", "suspended"].map((s) => (
                    <DropdownMenuItem key={s} onClick={() => { setFilterStatus(s); setPage(1); }}>{s.charAt(0).toUpperCase() + s.slice(1)}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100">
                <ChevronDownIcon className={cn("size-4 transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={refresh} className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100">
                  <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
                </Button>
                <AddUserDialog onUserAdded={refresh} />
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6">
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-900 p-4 text-white">
                <span className="text-sm font-medium">{selectedIds.size} members selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-emerald-100 hover:bg-emerald-800">Clear selection</Button>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border bg-background/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
                    <TableHead className="w-[50px] px-4 py-4 text-center"><Checkbox checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length} onChange={toggleAll} /></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("name")}><div className="flex items-center gap-2">Member <SortIcon columnKey="name" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("role")}><div className="flex items-center gap-2">Role <SortIcon columnKey="role" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("status")}><div className="flex items-center gap-2">Status <SortIcon columnKey="status" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("joined")}><div className="flex items-center gap-2">Joined <SortIcon columnKey="joined" /></div></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map(({ profile, member }) => (
                    <TableRow key={profile.id} className={cn("cursor-pointer transition-colors hover:bg-emerald-50/30", selectedIds.has(profile.id) && "bg-slate-50/50")} onClick={() => { setSelectedUser({ ...profile, role: member?.role, memberStatus: member?.status, joinedAt: member?.joinedAt }); setIsDetailModalOpen(true); }}>
                      <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(profile.id)} onChange={() => toggleRow(profile.id)} /></TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">{profile.firstName?.[0] ?? "?"}{profile.lastName?.[0] ?? ""}</div>
                          <div className="flex flex-col"><span className="font-bold text-emerald-950">{profile.firstName} {profile.lastName}</span><span className="text-xs text-muted-foreground">{profile.email}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 capitalize">{member?.role ?? "—"}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="outline" className={member?.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : member?.status === "suspended" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}>{member?.status ?? "pending"}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-500">{member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontalIcon className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser({ ...profile, role: member?.role, memberStatus: member?.status, joinedAt: member?.joinedAt }); setIsDetailModalOpen(true); }}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <DeleteUserDialog userId={profile.userId} userName={`${profile.firstName} ${profile.lastName}`} onDeleted={refresh} />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedRows.length === 0 && !isLoading && (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center"><Users className="h-10 w-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No members found.</p></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-muted-foreground">Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total} members</p>
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
        )}
      </div>
      <UserDetailModal user={selectedUser} open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} title={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "User Details"} onSave={refresh} />
    </section>
  );
}
