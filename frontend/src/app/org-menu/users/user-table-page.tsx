"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MailIcon,
  Users,
  MoreHorizontalIcon,
  PhoneIcon,
  SearchIcon,
  RefreshCw,
  Clock,
  Monitor,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { staffService, type UIStaff as User } from "@/lib/services/staff-service"

import { UserDetailModal } from "./user-detail-modal"
import { DeleteUserDialog } from "./delete-user-dialog"
import { toast } from "sonner"

const pageSizeOptions = [5, 10, 20, 50]

function getStatusClasses(status: string | null) {
  switch (status) {
    case "Active":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Inactive":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "On Leave":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "Deleted":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-slate-50 text-slate-700 border-emerald-100"
  }
}

function UserTable({ users, onRefetch }: { users: User[]; onRefetch: () => void }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("All")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [modalEditMode, setModalEditMode] = React.useState(false)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "asc" | "desc" | null
  }>({ key: "", direction: null })

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = users

    if (filterStatus !== "All") {
      result = result.filter((row) => row.status === filterStatus)
    }

    if (!query) return result

    return result.filter((row) =>
      `${row.firstName} ${row.lastName} ${row.empId} ${row.email} ${row.designation}`
        .toLowerCase()
        .includes(query)
    )
  }, [users, filterStatus, searchQuery])

  const sortedRows = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredRows

    return [...filteredRows].sort((a, b) => {
      const aValue = String(a[sortConfig.key as keyof typeof a])
      const bValue = String(b[sortConfig.key as keyof typeof b])

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredRows, sortConfig])

  const total = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize)

  const toggleAll = () => {
    if (selectedIds.size === paginatedRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedRows.map((row) => row.id)))
    }
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDownIcon className="size-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
    if (sortConfig.direction === "asc") return <ArrowUpIcon className="size-3.5 text-slate-600" />
    if (sortConfig.direction === "desc") return <ArrowDownIcon className="size-3.5 text-slate-600" />
    return <ArrowUpDownIcon className="size-3.5 opacity-30" />
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background mt-6">
      <div className="border-b bg-emerald-50/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-emerald-950">User Records</h2>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-slate-900">
                {total}
              </span>
            </div>
            <p className="hidden text-xs text-slate-900/75 xl:block">
              Manage organization users, roles, and access status.
            </p>
          </div>

          <div className="relative flex-1 px-4 lg:max-w-2xl">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, email..."
              className="h-12 bg-background pl-12 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100">
                  <FilterIcon className="mr-2 size-4" />
                  Status: {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["All", "Active", "Inactive", "On Leave", "Deleted"].map((s) => (
                  <DropdownMenuItem key={s} onClick={() => { setFilterStatus(s); setPage(1); }}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100"
            >
              <ChevronDownIcon className={cn("size-4 transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onRefetch()}
                className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100"
              >
                <RefreshCw className={cn("size-4")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {paginatedRows.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No users found</p>
              <p className="text-xs text-muted-foreground mt-1">Add users or adjust filters to see results.</p>
            </div>
          ) : (
          <div className="overflow-hidden rounded-xl border bg-background/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
                  <TableHead className="w-[50px] px-4 py-4 text-center">
                    <Checkbox
                      checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950">User</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("empId")}>
                    <div className="flex items-center gap-2">ID <SortIcon columnKey="empId" /></div>
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("designation")}>
                    <div className="flex items-center gap-2">Role <SortIcon columnKey="designation" /></div>
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("category")}>
                    <div className="flex items-center gap-2">Category <SortIcon columnKey="category" /></div>
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950">Contact</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Status</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Activity</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn("cursor-pointer transition-colors hover:bg-emerald-50/30", selectedIds.has(user.id) && "bg-slate-50/50")}
                    onClick={() => router.push(`/org-menu/users/${user.id}`)}
                  >
                    <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(user.id)} onChange={() => toggleRow(user.id)} />
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border-2 border-emerald-100">
                          {user.avatar ? <AvatarImage src={user.avatar} /> : null}
                          <AvatarFallback className="bg-slate-50 text-slate-700 font-bold">
                            {user.firstName?.[0] ?? ""}{user.lastName?.[0] ?? ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-950">{user.firstName} {user.lastName}</span>
                          <span className="text-xs text-muted-foreground">@{user.nickname}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium">{user.empId}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-900/80">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.designation}</span>
                        <span className="text-xs opacity-75">{user.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {user?.["category"] ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <MailIcon className="size-3 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <PhoneIcon className="size-3 text-muted-foreground" />
                          <span>{user.mobile}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("inline-flex min-w-20 items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusClasses(user.status))}>
                          {user.status}
                        </span>
                        {user.designation === "Owner" && (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                            Owner
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="size-3 text-emerald-600" />
                          <span className="font-medium text-slate-700">{user?.["activeHours"] ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Monitor className="size-3 text-blue-600" />
                          <span className="font-medium text-slate-700">{user?.["screenTime"] ?? "—"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <DeleteUserDialog userId={user.id} userName={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()} onDeleted={onRefetch} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontalIcon className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/org-menu/users/${user.id}`)}>View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user)
                              setModalEditMode(true)
                              setIsDetailModalOpen(true)
                            }}>Quick Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          {total > 0 && (
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total} users
            </p>
            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none"
              >
                {pageSizeOptions.map(o => <option key={o} value={o}>{o} per page</option>)}
              </select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        initialEditMode={modalEditMode}
        onSave={() => {
          onRefetch()
        }}
      />
    </div>
  )
}

function DeletedRecordsTable({ users, onRefetch }: { users: User[]; onRefetch: () => void }) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [reactivatingId, setReactivatingId] = React.useState<string | null>(null)

  const filteredRows = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter((row) =>
      `${row.firstName} ${row.lastName} ${row.empId} ${row.email} ${row.designation}`
        .toLowerCase()
        .includes(query)
    )
  }, [users, searchQuery])

  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize)

  const handleReactivate = async (user: User) => {
    setReactivatingId(user.id)
    try {
      await staffService.updateStaff(user.id, { status: "Active" })
      toast.success(`${user.firstName} ${user.lastName} reactivated successfully`)
      onRefetch()
    } catch {
      toast.error("Failed to reactivate user")
    } finally {
      setReactivatingId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-red-200 bg-background mt-6">
      <div className="border-b bg-red-50/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-red-950">Deleted Records</h2>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-bold text-red-900">
                {total}
              </span>
            </div>
            <p className="hidden text-xs text-red-900/75 xl:block">
              Soft-deleted users. Reactivate to restore access.
            </p>
          </div>

          <div className="relative flex-1 px-4 lg:max-w-2xl">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search deleted users..."
              className="h-12 bg-background pl-12 focus-visible:ring-red-500"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-red-200 bg-background text-red-950 hover:bg-red-100"
            >
              <ChevronDownIcon className={cn("size-4 transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")} />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {paginatedRows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">No deleted records found</p>
              <p className="text-xs mt-1">Deleted users will appear here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-background/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-red-50/70 hover:bg-red-50/70">
                      <TableHead className="px-4 py-4 font-semibold text-red-950">User</TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-red-950">ID</TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-red-950">Role</TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-red-950">Category</TableHead>
                      <TableHead className="px-4 py-4 font-semibold text-red-950">Contact</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-red-950">Status</TableHead>
                      <TableHead className="px-4 py-4 text-center font-semibold text-red-950">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((user) => (
                      <TableRow key={user.id} className="transition-colors hover:bg-red-50/30">
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10 border-2 border-red-100">
                              {user.avatar ? <AvatarImage src={user.avatar} /> : null}
                              <AvatarFallback className="bg-red-50 text-red-700 font-bold">
                                {user.firstName?.[0] ?? ""}{user.lastName?.[0] ?? ""}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-muted-foreground">@{user.nickname}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-medium">{user.empId}</TableCell>
                        <TableCell className="px-4 py-4 text-sm text-slate-900/80">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.designation}</span>
                            <span className="text-xs opacity-75">{user.department}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                            {user?.["category"] ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <MailIcon className="size-3 text-muted-foreground" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <PhoneIcon className="size-3 text-muted-foreground" />
                              <span>{user.mobile}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                            Deleted
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(user)}
                            disabled={reactivatingId === user.id}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <RotateCcw className={cn("mr-1.5 size-3.5", reactivatingId === user.id && "animate-spin")} />
                            {reactivatingId === user.id ? "Reactivating..." : "Reactivate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total} deleted users
                </p>
                <div className="flex items-center gap-4">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none"
                  >
                    {pageSizeOptions.map(o => <option key={o} value={o}>{o} per page</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function UserTablePage() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => staffService.getAllStaff(),
  })

  const activeUsers = React.useMemo(() => data.filter(u => u.status !== "Deleted"), [data])
  const deletedUsers = React.useMemo(() => data.filter(u => u.status === "Deleted"), [data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <UserTable users={activeUsers} onRefetch={refetch} />
      <DeletedRecordsTable users={deletedUsers} onRefetch={refetch} />
    </div>
  )
}
