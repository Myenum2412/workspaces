"use client"

import * as React from "react"
import { FilterIcon, SearchIcon, ChevronDownIcon } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface DataTableToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterChange: (value: string) => void
  statusOptions: string[]
  isExpanded: boolean
  onToggleExpand: () => void
  searchOnly?: boolean
  filtersOnly?: boolean
}

export function DataTableToolbar({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  statusOptions,
  isExpanded,
  onToggleExpand,
  searchOnly,
  filtersOnly,
}: DataTableToolbarProps) {
  if (searchOnly) {
    return (
      <div className="relative w-full lg:max-w-md mx-auto">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
          className="h-9 bg-background/50 pl-9  focus-visible:ring-emerald-500 border-emerald-200/50 w-full"
        />
      </div>
    )
  }

  if (filtersOnly) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-emerald-200/50 bg-background/50 text-emerald-950 hover:bg-emerald-100/50"
            >
              <FilterIcon className="mr-2 size-3.5" />
              <span className="text-xs font-medium">Filter: {filterStatus}</span>
              <ChevronDownIcon className="ml-2 size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status}
                className="text-sm"
                onClick={() => onFilterChange(status)}
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
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Collapse task table" : "Expand task table"}
          className="h-9 w-9 border-emerald-200/50 bg-background/50 text-emerald-950 hover:bg-emerald-100/50"
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-300",
              isExpanded ? "rotate-0" : "-rotate-90"
            )}
          />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
      <div className="relative flex-1 flex justify-center order-2 lg:order-none">
        <div className="relative w-full lg:max-w-md">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks..."
            className="h-9 bg-background/50 pl-9  focus-visible:ring-emerald-500 border-emerald-200/50"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 order-1 lg:order-none ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-emerald-200/50 bg-background/50 text-emerald-950 hover:bg-emerald-100/50"
            >
              <FilterIcon className="mr-2 size-3.5" />
              <span className="text-xs font-medium">Filter: {filterStatus}</span>
              <ChevronDownIcon className="ml-2 size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status}
                className="text-sm"
                onClick={() => onFilterChange(status)}
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
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Collapse task table" : "Expand task table"}
          className="h-9 w-9 border-emerald-200/50 bg-background/50 text-emerald-950 hover:bg-emerald-100/50"
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
  )
}
