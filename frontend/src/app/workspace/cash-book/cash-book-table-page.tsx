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
  MoreHorizontalIcon,
  SearchIcon,
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
import { cn } from "@/lib/utils"

interface CashRow {
  sno: string
  date: string
  voucher: string
  description: string
  staff: string
  branch: string
  billStatus: string
  verification: string
  category: string
  cashOut: string
  cashIn: string
  prevBalance: string
  balance: string
}

const cashRows: CashRow[] = []

const pageSizeOptions = [4, 10, 20, 50]

function getStatusClasses(status: string) {
  switch (status) {
    case "Cleared":
    case "Verified":
      return "bg-slate-50 text-slate-700 border-primary/10"
    case "Hold":
    case "Pending":
      return "bg-slate-50 text-slate-700 border-primary/10"
    case "Open":
    case "Unverified":
      return "bg-slate-50 text-slate-700 border-primary/10"
    default:
      return "bg-slate-50 text-slate-700 border-primary/10"
  }
}

export function CashBookTablePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("All")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(4)
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
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
    let result = cashRows

    if (filterStatus !== "All") {
      result = result.filter((row) => row.billStatus === filterStatus)
    }

    if (!query) {
      return result
    }

    return result.filter((row) =>
      Object.values(row).join(" ").toLowerCase().includes(query)
    )
  }, [filterStatus, searchQuery])

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
      setSelectedIds(new Set(paginatedRows.map((row) => row.sno)))
    }
  }

  const toggleRow = (sno: string) => {
    const next = new Set(selectedIds)
    if (next.has(sno)) {
      next.delete(sno)
    } else {
      next.add(sno)
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
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Cash Book
        </h1>
        <p className="text-sm text-muted-foreground">
          Track cash out, cash in, balance movement, and bill verification.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-background ">
        <div className="border-b bg-primary/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="shrink-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-primary">
                  Cash Book Table
                </h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-slate-900">
                  {total}
                </span>
              </div>
              <p className="hidden text-xs text-slate-900/75 xl:block">
                Review transaction flow and attached evidence in one place.
              </p>
            </div>

            <div className="relative flex-1 px-4 lg:max-w-2xl">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by voucher, staff, branch..."
                className="h-12 bg-background pl-12  focus-visible:ring-primary"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-200 bg-background text-primary hover:bg-primary/10"
                  >
                    <FilterIcon className="mr-2 size-4" />
                    Filter: {filterStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["All", "Open", "Hold", "Cleared"].map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => {
                        setFilterStatus(status)
                        setPage(1)
                      }}
                    >
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsExpanded((value) => !value)}
                aria-label={isExpanded ? "Collapse cash book table" : "Expand cash book table"}
                className="border-slate-200 bg-background text-primary hover:bg-primary/10"
              >
                <ChevronDownIcon
                  className={cn(
                    "size-4 transition-transform duration-300",
                    isExpanded ? "rotate-0" : "-rotate-90"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>

        {isExpanded ? (
          <div className="p-6">
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-primary p-4 text-white ">
                <span className="text-sm font-medium">
                  {selectedIds.size} entries selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-primary-foreground hover:bg-primary/80 hover:text-white"
                >
                  Clear selection
                </Button>
              </div>
            )}

            {paginatedRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/60">
                  <FileTextIcon className="size-8 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">No cash book entries found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search term or reset the status filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border bg-background/70">
                  <Table className="w-full min-w-max table-auto">
                    <TableHeader>
                      <TableRow className="bg-primary/10 hover:bg-primary/10">
                        <TableHead className="w-[50px] px-4 py-4 text-center">
                          <Checkbox
                            checked={
                              paginatedRows.length > 0 &&
                              selectedIds.size === paginatedRows.length
                            }
                            onChange={toggleAll}
                            aria-label="Select all cash rows"
                          />
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("sno")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            S.No
                            <SortIcon columnKey="sno" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <CalendarIcon className="size-4" />
                            Date
                            <SortIcon columnKey="date" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("voucher")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Voucher
                            <SortIcon columnKey="voucher" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("description")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Description
                            <SortIcon columnKey="description" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("staff")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Staff
                            <SortIcon columnKey="staff" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("branch")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Branch
                            <SortIcon columnKey="branch" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("billStatus")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Bill Status
                            <SortIcon columnKey="billStatus" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("verification")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Verification
                            <SortIcon columnKey="verification" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("category")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Category
                            <SortIcon columnKey="category" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("cashOut")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Cash Out
                            <SortIcon columnKey="cashOut" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("cashIn")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Cash In
                            <SortIcon columnKey="cashIn" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("prevBalance")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Prev. Balance
                            <SortIcon columnKey="prevBalance" />
                          </div>
                        </TableHead>
                        <TableHead 
                          className="px-4 py-4 text-center font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors group"
                          onClick={() => handleSort("balance")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Balance
                            <SortIcon columnKey="balance" />
                          </div>
                        </TableHead>
                        <TableHead className="px-4 py-4 text-center font-semibold text-primary">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row) => (
                        <TableRow
                          key={row.sno}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-primary/5",
                            selectedIds.has(row.sno) && "bg-slate-50/50"
                          )}
                        >
                          <TableCell
                            className="px-4 py-4 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedIds.has(row.sno)}
                              onChange={() => toggleRow(row.sno)}
                              aria-label={`Select ${row.sno}`}
                            />
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center font-semibold text-primary">
                            {row.sno}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center font-medium text-emerald-800">
                            {row.date}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            {row.voucher}
                          </TableCell>
                          <TableCell className="max-w-sm px-4 py-4 text-left">
                            <p className="font-medium">{row.description}</p>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            {row.staff}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            {row.branch}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                                getStatusClasses(row.billStatus)
                              )}
                            >
                              {row.billStatus}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                "inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                                getStatusClasses(row.verification)
                              )}
                            >
                              {row.verification}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            {row.category}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center font-medium text-slate-700">
                            {row.cashOut}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center font-medium text-slate-700">
                            {row.cashIn}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            {row.prevBalance}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center font-bold">
                            {row.balance}
                          </TableCell>
                          <TableCell
                            className="px-4 py-4 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={`Actions for ${row.sno}`}
                                >
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View entry</DropdownMenuItem>
                                <DropdownMenuItem>Edit entry</DropdownMenuItem>
                                <DropdownMenuItem>Download attachment</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  Delete entry
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)}{" "}
                    of {total} cash entries
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      Rows
                      <select
                        value={pageSize}
                        onChange={(event) => {
                          setPageSize(Number(event.target.value))
                          setPage(1)
                        }}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                      >
                        {pageSizeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon className="size-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setPage((value) => Math.min(totalPages, value + 1))
                        }
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRightIcon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
