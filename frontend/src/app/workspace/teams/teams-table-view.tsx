"use client"

import * as React from "react"
import {
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  UsersIcon,
  BarChart3Icon,
  ExternalLinkIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { teamService } from "@/lib/services/team-service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Team {
  id: string
  name: string
  head: string
  members: number
  projects: number
  status: "Active" | "Inactive"
}

export function TeamsTableView({ onTeamClick }: { onTeamClick: (team: any) => void }) {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.getAllTeams(),
  })

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("All")
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(4)
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

  const filteredTeams = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let result = teams

    if (filterStatus !== "All") {
      result = result.filter((t) => t.status === filterStatus)
    }

    if (!query) return result

    return result.filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.head.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query)
    )
  }, [filterStatus, searchQuery])

  const sortedTeams = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredTeams

    return [...filteredTeams].sort((a, b) => {
      const aValue = String(a[sortConfig.key as keyof typeof a])
      const bValue = String(b[sortConfig.key as keyof typeof b])

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredTeams, sortConfig])

  const total = sortedTeams.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTeams = sortedTeams.slice(startIndex, startIndex + pageSize)

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDownIcon className="size-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
    if (sortConfig.direction === "asc") return <ArrowUpIcon className="size-3.5 text-slate-600" />
    if (sortConfig.direction === "desc") return <ArrowDownIcon className="size-3.5 text-slate-600" />
    return <ArrowUpDownIcon className="size-3.5 opacity-30" />
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-background ">
      {/* Table Header Design matching my-task */}
      <div className="border-b bg-emerald-50/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="shrink-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-emerald-950">
                Team Directory
              </h2>
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-slate-900">
                {total}
              </span>
            </div>
            <p className="hidden text-xs text-slate-900/75 xl:block">
              Manage and visualize team reporting structures.
            </p>
          </div>

          <div className="relative flex-1 px-4 lg:max-w-2xl">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by team name or head..."
              className="h-12 bg-background pl-12  focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100"
                >
                  <FilterIcon className="mr-2 size-4" />
                  Filter: {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["All", "Active", "Inactive"].map((status) => (
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-slate-200 bg-background text-emerald-950 hover:bg-emerald-100"
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

      {isExpanded && (
        <div className="p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="text-slate-600 font-bold animate-pulse">Loading real teams...</span>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-background/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50/70 hover:bg-emerald-50/70">
                      <TableHead
                        className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer hover:bg-emerald-100/50 transition-colors group"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-2">
                          Team Name
                          <SortIcon columnKey="name" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-4 py-4 font-semibold text-emerald-950 cursor-pointer hover:bg-emerald-100/50 transition-colors group"
                        onClick={() => handleSort("head")}
                      >
                        <div className="flex items-center gap-2">
                          Department Head
                          <SortIcon columnKey="head" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-4 py-4 text-center font-semibold text-emerald-950 cursor-pointer hover:bg-emerald-100/50 transition-colors group"
                        onClick={() => handleSort("members")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Members
                          <SortIcon columnKey="members" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-4 py-4 text-center font-semibold text-emerald-950 cursor-pointer hover:bg-emerald-100/50 transition-colors group"
                        onClick={() => handleSort("projects")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Projects
                          <SortIcon columnKey="projects" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="px-4 py-4 text-center font-semibold text-emerald-950 cursor-pointer hover:bg-emerald-100/50 transition-colors group"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Status
                          <SortIcon columnKey="status" />
                        </div>
                      </TableHead>
                      <TableHead className="px-4 py-4 text-right font-semibold text-emerald-950 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTeams.map((team) => (
                      <TableRow
                        key={team.id}
                        className="cursor-pointer transition-colors hover:bg-emerald-50/30"
                        onClick={() => onTeamClick(team)}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                              {team.name[0]}
                            </div>
                            <span className="font-medium">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-muted-foreground">{team.head}</TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <UsersIcon className="size-3.5 text-slate-600" />
                            <span className="font-medium">{team.members}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <BarChart3Icon className="size-3.5 text-slate-600" />
                            <span className="font-medium">{team.projects}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <Badge
                            variant={team.status === "Active" ? "default" : "secondary"}
                            className={cn(
                              "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                              team.status === "Active" ? "bg-emerald-600 text-white" : "bg-emerald-200 text-slate-700"
                            )}
                          >
                            {team.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-slate-700 hover:text-emerald-800 hover:bg-emerald-50">
                              View Flow <ExternalLinkIcon className="ml-2 size-3.5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:bg-emerald-50">
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Team</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total} teams
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    Rows
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setPage(1)
                      }}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring"
                    >
                      {[4, 10, 20, 50].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
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
