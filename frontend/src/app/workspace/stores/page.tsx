"use client"

import * as React from "react"
import { SearchIcon, ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Explore apps for Stores</h1>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for apps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base bg-white shadow-sm border-slate-300"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal">
            Pricing <ChevronDownIcon className="ml-1.5 size-4 opacity-50" />
          </Button>
          <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal">
            Trust signals <ChevronDownIcon className="ml-1.5 size-4 opacity-50" />
          </Button>
          <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal">
            Categories <ChevronDownIcon className="ml-1.5 size-4 opacity-50" />
          </Button>
          <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal">
            Use cases <ChevronDownIcon className="ml-1.5 size-4 opacity-50" />
          </Button>
          <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal">
            More filters <ChevronDownIcon className="ml-1.5 size-4 opacity-50" />
          </Button>
        </div>
      </div>
    </div>
  )
}
