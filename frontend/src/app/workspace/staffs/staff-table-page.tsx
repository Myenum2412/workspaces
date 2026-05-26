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
import { StaffDetailModal } from "./staff-detail-modal"
import { AddStaffDialog } from "./add-staff-dialog"
import { useQuery } from "@tanstack/react-query"
import { staffService, type UIStaff as Staff } from "@/lib/services/staff-service"
import { RefreshCw } from "lucide-react"


const pageSizeOptions = [5, 10, 20, 50]

function getStatusClasses(status: string | null) {
  switch (status) {
    case "Active":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "Inactive":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    case "On Leave":
      return "bg-slate-50 text-slate-700 border-emerald-100"
    default:
      return "bg-slate-50 text-slate-700 border-emerald-100"
  }
}

export function StaffTablePage() {
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAllStaff(),
  })

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("All")
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
      result = result.filter((row) => row.status === filterStatus)
    }

    if (!query) return result

    return result.filter((row) =>
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
                {["All", "Active", "Inactive"].map((s) => (
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
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-emerald-900 p-4 text-white ">
              <span className="text-sm font-medium">{selectedIds.size} staff members selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-emerald-100 hover:bg-emerald-800">
                Clear selection
              </Button>
            </div>
          )}

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
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950">Employee</TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("empId")}>
                    <div className="flex items-center gap-2">ID <SortIcon columnKey="empId" /></div>
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer group" onClick={() => handleSort("designation")}>
                    <div className="flex items-center gap-2">Designation <SortIcon columnKey="designation" /></div>
                  </TableHead>
                  <TableHead className="px-4 py-4 font-semibold text-emerald-950">Contact</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Status</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Online Status</TableHead>
                  <TableHead className="px-4 py-4 text-center font-semibold text-emerald-950">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((staff) => (
                  <TableRow
                    key={staff.id}
                    className={cn("cursor-pointer transition-colors hover:bg-emerald-50/30", selectedIds.has(staff.id) && "bg-slate-50/50")}
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
                        <Avatar className="size-10 border-2 border-emerald-100">
                          <AvatarImage src={staff.avatar} />
                          <AvatarFallback className="bg-slate-50 text-slate-700 font-bold">
                            {staff.firstName[0]}{staff.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-950">{staff.firstName} {staff.lastName}</span>
                          <span className="text-xs text-muted-foreground">@{staff.nickname}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium">{staff.empId}</TableCell>
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
                      <span className={cn("inline-flex min-w-20 items-center justify-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", getStatusClasses(staff.status))}>
                        {staff.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          staff.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        )} />
                        <span className="text-[11px] font-bold text-slate-600">
                          {staff.status === "Active" ? "Online" : "Offline"}
                        </span>
                      </div>
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
                          <DropdownMenuItem className="text-destructive" onClick={() => {
                            //setData(prev => prev.map(s => s.id === staff.id ? { ...s, status: "Inactive" } : s))
                          }}>Deactivate</DropdownMenuItem>
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
