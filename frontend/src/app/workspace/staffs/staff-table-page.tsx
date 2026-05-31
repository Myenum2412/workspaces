"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  FilterIcon,
  MailIcon,
  MoreHorizontalIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { API_BASE_URL } from "@/lib/api/config"
import { io } from "socket.io-client"
import { toast } from "sonner"
import { StaffDetailModal } from "./staff-detail-modal"
import { AddStaffDialog } from "./add-staff-dialog"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { staffService, type UIStaff as Staff } from "@/lib/services/staff-service"
import { RefreshCw } from "lucide-react"


const pageSizeOptions = [5, 10, 20, 50]

function getStatusClasses(status: string | null) {
  switch (status) {
    case "active":
    case "Active":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "inactive":
    case "Inactive":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "On Leave":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    default:
      return "bg-slate-50 text-slate-700 border-emerald-100"
  }
}

export function StaffTablePage() {
  const queryClient = useQueryClient()
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAllStaff(),
  })

  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = React.useState<Set<string>>(new Set())
  
  const { data: verificationsData = {} } = useQuery({
    queryKey: ["staff-verifications", data.map((s: Staff) => s.email).join(",")],
    queryFn: async () => {
      const emails = data.map((s: Staff) => s.email).filter(Boolean)
      if (emails.length === 0) return {}
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`${API_BASE_URL}/api/auth/verifications`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ emails })
      })
      if (!res.ok) return {}
      const json = await res.json()
      return json.verifications || {}
    },
    enabled: data.length > 0
  })

  const { data: userStatuses = {} } = useQuery({
    queryKey: ["staff-statuses", data.map((s: Staff) => s.userId).join(",")],
    queryFn: async () => {
      const userIds = data.map((s: Staff) => s.userId).filter(Boolean)
      if (userIds.length === 0) return {}
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`${API_BASE_URL}/api/auth/statuses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userIds })
      })
      if (!res.ok) return {}
      const json = await res.json()
      return json.statuses || {}
    },
    enabled: data.length > 0
  })

  React.useEffect(() => {
    let socket: ReturnType<typeof io> | null = null;
    
    async function initSocket() {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return
        
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        
        const authData = await res.json()
        const userId = authData.user?.$id
        
        if (userId) {
          setCurrentUserId(userId)
          socket = io(API_BASE_URL)
          
          socket.on("connect", () => {
            socket?.emit("identify", userId)
            socket?.emit("get_online_users", (users: string[]) => {
              setOnlineUsers(new Set(users))
            })
            socket?.emit("subscribe", "user_profiles")
          })

          socket.on("change", (changeData: any) => {
            if (changeData && changeData.collection === "user_profiles") {
              queryClient.invalidateQueries({ queryKey: ["staff"] })
              queryClient.invalidateQueries({ queryKey: ["staff-stats"] })
            }
          })
          
          socket.on("verification_update", (payload: any) => {
            queryClient.setQueriesData({ queryKey: ["staff-verifications"] }, (old: any) => {
              return {
                ...(old || {}),
                [payload.email]: {
                  emailVerified: payload.emailVerified,
                  verifiedAt: payload.verifiedAt
                }
              }
            })
          })

          socket.on("presence_update", ({ userId: updateUserId, online, status }: { userId: string, online: boolean, status?: string }) => {
            setOnlineUsers(prev => {
              const next = new Set(prev)
              if (online) next.add(updateUserId)
              else next.delete(updateUserId)
              return next
            })
            
            queryClient.setQueriesData({ queryKey: ["staff-statuses"] }, (old: any) => {
              return {
                ...(old || {}),
                [updateUserId]: status || (online ? "Online" : "Offline")
              }
            })
          })
        }
      } catch (err) {
        console.error("Failed to initialize staff socket connection:", err)
      }
    }

    initSocket()

    return () => {
      if (socket) socket.disconnect()
    }
  }, [queryClient])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("Active")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(5)
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [selectedStaff, setSelectedStaff] = React.useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [modalEditMode, setModalEditMode] = React.useState(false)
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "asc" | "desc" | null
  }>({ key: "", direction: null })

  const deactivateMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return staffService.updateStaff(staffId, { status: "Inactive" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      toast.success("Staff member deactivated successfully")
    },
    onError: () => {
      toast.error("Failed to deactivate staff member")
    }
  })

  const reactivateMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return staffService.updateStaff(staffId, { status: "Active" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] })
      toast.success("Staff member re-activated successfully")
    },
    onError: () => {
      toast.error("Failed to re-activate staff member")
    }
  })

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
    let result = data

    if (filterStatus !== "All") {
      result = result.filter((row: Staff) => row.status?.toLowerCase() === filterStatus.toLowerCase())
    }

    if (!query) return result

    return result.filter((row: Staff) =>
      `${row.firstName} ${row.lastName} ${row.empId} ${row.email} ${row.designation}`
        .toLowerCase()
        .includes(query)
    )
  }, [data, filterStatus, searchQuery])

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
      setSelectedIds(new Set(paginatedRows.map((row: Staff) => row.id)))
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
    <div className="overflow-hidden rounded-2xl border bg-background  mt-6">
      <div className="border-b bg-emerald-50/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-emerald-950">Staff Records</h2>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-slate-900">
                {total}
              </span>
            </div>
            <p className="hidden text-xs text-slate-900/75 xl:block">
              Manage and monitor employee status and professional details.
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
              className="h-12 bg-background pl-12  focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Tabs value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <TabsList className="bg-emerald-100/50">
                <TabsTrigger value="Active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Active Staff</TabsTrigger>
                <TabsTrigger value="Inactive" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Deactivated</TabsTrigger>
                <TabsTrigger value="All" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">All Staff</TabsTrigger>
              </TabsList>
            </Tabs>

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
                onClick={() => refetch()}
                className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100"
              >
                <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {(() => {
            const isDeactivatedTab = filterStatus === "Inactive";
            const theme = isDeactivatedTab ? {
              bgLight: "bg-red-50/70",
              bgHover: "hover:bg-red-50/70",
              rowHover: "hover:bg-red-50/30",
              textDark: "text-red-950",
              border: "border-red-100",
              bgSelection: "bg-red-900",
              textSelectionBtn: "text-red-100 hover:bg-red-800",
            } : {
              bgLight: "bg-emerald-50/70",
              bgHover: "hover:bg-emerald-50/70",
              rowHover: "hover:bg-emerald-50/30",
              textDark: "text-emerald-950",
              border: "border-emerald-100",
              bgSelection: "bg-emerald-900",
              textSelectionBtn: "text-emerald-100 hover:bg-emerald-800",
            };
            return (
              <>
                {selectedIds.size > 0 && (
                  <div className={cn("mb-4 flex items-center justify-between rounded-xl p-4 text-white", theme.bgSelection)}>
                    <span className="text-sm font-medium">{selectedIds.size} staff members selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className={theme.textSelectionBtn}>
                      Clear selection
                    </Button>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border bg-background/70">
                  <Table>
                    <TableHeader>
                      <TableRow className={cn(theme.bgLight, theme.bgHover)}>
                        <TableHead className="w-[50px] px-4 py-4 text-center">
                          <Checkbox
                            checked={paginatedRows.length > 0 && selectedIds.size === paginatedRows.length}
                            onChange={toggleAll}
                          />
                        </TableHead>
                        <TableHead className={cn("px-4 py-4 font-semibold", theme.textDark)}>Employee</TableHead>
                        <TableHead className={cn("px-4 py-4 font-semibold cursor-pointer group", theme.textDark)} onClick={() => handleSort("empId")}>
                          <div className="flex items-center gap-2">Employee ID <SortIcon columnKey="empId" /></div>
                        </TableHead>
                        <TableHead className={cn("px-4 py-4 font-semibold cursor-pointer group", theme.textDark)} onClick={() => handleSort("designation")}>
                          <div className="flex items-center gap-2">Designation <SortIcon columnKey="designation" /></div>
                        </TableHead>
                        <TableHead className={cn("px-4 py-4 font-semibold", theme.textDark)}>Contact</TableHead>
                        <TableHead className={cn("px-4 py-4 text-center font-semibold", theme.textDark)}>Verification Status</TableHead>
                        <TableHead className={cn("px-4 py-4 text-center font-semibold", theme.textDark)}>Online Status</TableHead>
                        <TableHead className={cn("px-4 py-4 text-center font-semibold", theme.textDark)}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((staff: Staff) => (
                        <TableRow
                          key={staff.id}
                          className={cn("cursor-pointer transition-colors", theme.rowHover, selectedIds.has(staff.id) && "bg-slate-50/50")}
                          onClick={() => {
                            setSelectedStaff(staff)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(staff.id)} onChange={() => toggleRow(staff.id)} />
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className={cn("size-10 border-2", theme.border)}>
                                <AvatarImage src={staff.avatar ?? undefined} />
                                <AvatarFallback className="bg-slate-50 text-slate-700 font-bold">
                                  {staff.firstName?.[0] ?? ""}{staff.lastName?.[0] ?? ""}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className={cn("font-bold", theme.textDark)}>{staff.firstName} {staff.lastName}</span>
                                <span className="text-xs text-muted-foreground">@{staff.nickname}</span>
                              </div>
                            </div>
                          </TableCell>
                    <TableCell className="px-4 py-4 font-medium">{staff.empId || "N/A"}</TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-900/80">
                      <div className="flex flex-col">
                        <span className="font-medium">{staff.designation}</span>
                        <span className="text-xs opacity-75">{staff.department}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <MailIcon className="size-3 text-muted-foreground" />
                          <span>{staff.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <PhoneIcon className="size-3 text-muted-foreground" />
                          <span>{staff.mobile}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {(() => {
                        const vData = (verificationsData as Record<string, any>)[staff.email] || {};
                        const isVerified = vData.emailVerified;
                        return isVerified ? (
                          <Badge 
                            className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" 
                            title={vData.verifiedAt ? `Verified at: ${new Date(vData.verifiedAt).toLocaleString()}` : "Verified"}
                          >
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                            Unverified
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {(() => {
                        const currentStatus = userStatuses[staff.userId] || (onlineUsers.has(staff.userId) ? "Online" : "Offline");
                        let dotClass = "bg-slate-300";
                        if (currentStatus === "Online") dotClass = "bg-emerald-500 animate-pulse";
                        else if (currentStatus === "Leave") dotClass = "bg-red-500";
                        else if (currentStatus !== "Offline") dotClass = "bg-amber-500";
                        return (
                          <div className="flex items-center justify-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", dotClass)} />
                            <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                              {currentStatus}
                            </span>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontalIcon className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedStaff(staff)
                            setModalEditMode(false)
                            setIsDetailModalOpen(true)
                          }}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedStaff(staff)
                            setModalEditMode(true)
                            setIsDetailModalOpen(true)
                          }}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // In a real app, this would call an API endpoint like staffService.resendVerification(staff.email)
                            toast.success(`Verification email has been re-sent to ${staff.email}`)
                          }}>Re-send Mail Verification</DropdownMenuItem>
                          {staff.status === "Active" ? (
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              deactivateMutation.mutate(staff.id)
                            }}>Deactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600 font-bold" onClick={() => {
                              reactivateMutation.mutate(staff.id)
                            }}>Re-activate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total} staff members
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
                <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          </>
          )
        })()}
        </div>
      )}

      <StaffDetailModal
        staff={selectedStaff}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        initialEditMode={modalEditMode}
        onSave={(updatedStaff) => {
          // setData(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s))
          refetch()
          setSelectedStaff(updatedStaff)
        }}
      />
    </div>
  )
}
