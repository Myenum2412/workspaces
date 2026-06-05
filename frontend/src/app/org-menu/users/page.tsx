"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ChevronDownIcon,
  ChevronLeftIcon, ChevronRightIcon, FilterIcon, MoreHorizontalIcon,
  SearchIcon, RefreshCw, Users, UserCheck, UserPlus, UserX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useOrgAuth } from "../auth-context";
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

  const { data: userList = [], isLoading } = useQuery({
    queryKey: ["org-users", orgId],
    queryFn: async () => {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>(`/api/users?limit=1000`);
        return res.data || [];
      } catch (err) { console.error("Error fetching users:", err); return []; }
    },
    enabled: !!orgId,
  });

  const data: UserRow[] = React.useMemo(
    () => userList.map((user) => ({
      profile: { ...user, id: user._id || user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      member: { role: user.role, status: user.status, joinedAt: user.createdAt } as any,
    })),
    [userList]
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
    queryClient.invalidateQueries({ queryKey: ["org-users", orgId] });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDownIcon className="size-3.5 opacity-30" />;
    if (sortConfig.direction === "asc") return <ArrowUpIcon className="size-3.5 text-muted-foreground" />;
    if (sortConfig.direction === "desc") return <ArrowDownIcon className="size-3.5 text-muted-foreground" />;
    return <ArrowUpDownIcon className="size-3.5 opacity-30" />;
  };

  const stats = React.useMemo(() => {
    return {
      total: data.length,
      active: data.filter(d => d.member?.status === "active").length,
      pending: data.filter(d => d.member?.status === "pending" || !d.member?.status).length,
      suspended: data.filter(d => d.member?.status === "suspended").length,
    };
  }, [data]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1A18]">Users Overview</h1>
        <p className="text-sm text-[#8F9792] mt-1">High-level metrics for your organization members</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#8F9792]">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#35848D]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F1A18]">{isLoading ? "—" : stats.total}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#8F9792]">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-[#40D1C5]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F1A18]">{isLoading ? "—" : stats.active}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#8F9792]">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-[#3FACAE]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F1A18]">{isLoading ? "—" : stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#8F9792]">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F1A18]">{isLoading ? "—" : stats.suspended}</div>
          </CardContent>
        </Card>
      </div>
      <div className="overflow-hidden rounded-[20px] border border-[#BDCFC5]/30 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="border-b border-[#BDCFC5]/30 bg-[#244E4B] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#40D1C5] px-2 text-xs font-bold text-[#0F1A18] shadow-sm">{total}</span>
              </div>
              <p className="hidden text-xs text-[#BDCFC5] xl:block">Manage organization members, roles, and access.</p>
            </div>
            <div className="relative flex-1 px-4 lg:max-w-2xl">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-[#8F9792]" />
              <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Search by name, email..." className="h-12 bg-white/80 border-[#BDCFC5]/40 pl-12 text-[#0F1A18] focus-visible:ring-[#3FACAE] placeholder:text-[#8F9792]" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/20 bg-[#35848D] text-white hover:bg-[#3FACAE] hover:text-white">
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
              <Button type="button" variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="border-white/20 bg-[#35848D] text-white hover:bg-[#3FACAE] hover:text-white">
                <ChevronDownIcon className={cn("size-4 transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={refresh} className="border-white/20 bg-[#35848D] text-white hover:bg-[#3FACAE] hover:text-white">
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
              <div className="mb-4 flex items-center justify-between rounded-xl bg-primary p-4 text-white">
                <span className="text-sm font-medium">{selectedIds.size} members selected</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-primary-foreground hover:bg-primary/80">Clear selection</Button>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border border-[#BDCFC5]/40 bg-white/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F1A18] hover:bg-[#0F1A18] border-b-0">
                    <TableHead className="w-[50px] px-4 py-4 text-center"><Checkbox checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length} onChange={toggleAll} /></TableHead>
                    <TableHead className="w-[60px] px-4 py-4 font-semibold text-[#FAF3E4]">S.no</TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4] cursor-pointer group" onClick={() => handleSort("name")}><div className="flex items-center gap-2">Member <SortIcon columnKey="name" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4] cursor-pointer group" onClick={() => handleSort("role")}><div className="flex items-center gap-2">Role <SortIcon columnKey="role" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4] cursor-pointer group" onClick={() => handleSort("status")}><div className="flex items-center gap-2">Status <SortIcon columnKey="status" /></div></TableHead>
                    <TableHead className="px-4 py-4 font-semibold text-[#FAF3E4] cursor-pointer group" onClick={() => handleSort("joined")}><div className="flex items-center gap-2">Joined <SortIcon columnKey="joined" /></div></TableHead>
                    <TableHead className="px-4 py-4 text-center font-semibold text-[#FAF3E4]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map(({ profile, member }, index) => (
                    <TableRow key={profile.id} className={cn("cursor-pointer transition-colors even:bg-[#BDCFC5]/10 odd:bg-transparent hover:bg-[#40D1C5]/10 border-b border-[#BDCFC5]/30", selectedIds.has(profile.id) && "bg-[#40D1C5]/20")} onClick={() => { setSelectedUser({ ...profile, role: member?.role, memberStatus: member?.status, joinedAt: member?.joinedAt }); setIsDetailModalOpen(true); }}>
                      <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(profile.id)} onChange={() => toggleRow(profile.id)} /></TableCell>
                      <TableCell className="px-4 py-4 text-sm font-medium text-[#8F9792]">{startIndex + index + 1}</TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3FACAE]/20 text-sm font-bold text-[#244E4B]">{profile.firstName?.[0] ?? "?"}{profile.lastName?.[0] ?? ""}</div>
                          <div className="flex flex-col"><span className="font-bold text-[#0F1A18]">{profile.firstName} {profile.lastName}</span><span className="text-xs text-[#8F9792]">{profile.email}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 capitalize text-[#8F9792]">{member?.role ?? "—"}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="outline" className={member?.status === "active" ? "bg-[#40D1C5]/10 text-[#35848D] border-[#40D1C5]/40" : member?.status === "suspended" ? "bg-[#35848D]/10 text-[#35848D] border-[#35848D]/40" : "bg-[#8F9792]/10 text-[#8F9792] border-[#8F9792]/30"}>{member?.status ?? "pending"}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-[#8F9792]">{member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}</TableCell>
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
                    <TableRow><TableCell colSpan={7} className="py-12 text-center"><Users className="h-10 w-10 text-[#BDCFC5] mx-auto mb-3" /><p className="text-sm text-[#8F9792]">No members found.</p></TableCell></TableRow>
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
