"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api/config";
import { profileApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import {
  Loader2,
  Search,
  UserCircle2Icon,
  ShieldCheckIcon,
  ShieldOffIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminUsers({ page, limit: 20, search, status: statusFilter }),
    queryFn: () =>
      profileApi.adminListUsers({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const profiles = data?.profiles ?? [];
  const totalPages = data?.pages ?? 1;

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: () =>
      profileApi.adminSetStatus(selectedUser._id, newStatus, statusReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers({}) });
      setShowStatusDialog(false);
      setSelectedUser(null);
      toast.success(`User ${newStatus === "active" ? "activated" : "updated"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const handleOpenStatusDialog = (user: any, status: string) => {
    setSelectedUser(user);
    setNewStatus(status);
    setStatusReason("");
    setShowStatusDialog(true);
  };

  const getInitials = (p: any) =>
    (`${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`).toUpperCase() || "U";

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "secondary" as const;
      case "suspended": return "destructive" as const;
      case "inactive": return "outline" as const;
      default: return "outline" as const;
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage user profiles, roles, and account status.</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
          <CardDescription>{data?.total ?? 0} users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No users found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p: any) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {p.avatarUrl && (
                              <AvatarImage src={p.avatarUrl.startsWith("http") ? p.avatarUrl : `${API_BASE_URL}${p.avatarUrl}`} />
                            )}
                            <AvatarFallback>{getInitials(p)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.designation ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(p.status)} className="capitalize">
                          {p.status ?? "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${p.profileCompletion ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{p.profileCompletion ?? 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.lastLogin ? new Date(p.lastLogin).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status !== "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenStatusDialog(p, "active")}
                              title="Activate"
                            >
                              <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                          {p.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenStatusDialog(p, "suspended")}
                              title="Suspend"
                            >
                              <ShieldOffIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/workspace/profile?userId=${p._id}`, "_blank")}
                            title="View Profile"
                          >
                            <UserCircle2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === "active" ? "Activate User" : newStatus === "suspended" ? "Suspend User" : "Update Status"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {newStatus === "suspended"
                    ? `Suspend ${selectedUser.firstName} ${selectedUser.lastName}? The user will lose access.`
                    : `Activate ${selectedUser.firstName} ${selectedUser.lastName}?`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Input
                placeholder="Reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
              <Button
                onClick={() => statusMutation.mutate()}
                disabled={statusMutation.isPending}
                variant={newStatus === "suspended" ? "destructive" : "default"}
              >
                {statusMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
                ) : (
                  newStatus === "suspended" ? "Suspend" : "Activate"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
