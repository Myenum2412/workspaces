"use client"

import * as React from "react"
import { 
  SearchIcon, 
  ChevronDownIcon, 
  Building2, 
  Umbrella, 
  FolderOpen, 
  Star, 
  ClipboardCheck, 
  Building, 
  FileCheck2, 
  Files 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OfficeFilesPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  const services = [
    { name: "Employee Information", icon: Building2, color: "text-amber-500" },
    { name: "Leave Tracker", icon: Umbrella, color: "text-sky-500" },
    { name: "Files", icon: FolderOpen, color: "text-sky-500" },
    { name: "HR Letters", icon: Star, color: "text-orange-500" },
    { name: "Travel", icon: Star, color: "text-orange-500" },
    { name: "Tasks", icon: ClipboardCheck, color: "text-orange-500" },
    { name: "General", icon: Building, color: "text-amber-500" },
    { name: "Approvals", icon: FileCheck2, color: "text-orange-500" },
    { name: "Data Administration", icon: Files, color: "text-pink-600" },
  ]

  return (
    <div className="space-y-6 w-full pb-10 min-h-screen px-2 pt-2">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">Explore Office Files</h1>
        
        <div className="relative max-w-2xl mx-auto mt-4">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for files"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-base bg-white shadow-sm border-slate-300 rounded-xl"
          />
        </div>

      </div>

      {/* Services Section */}
      <div className="pt-8 space-y-6">
        <h2 className="text-[15px] font-semibold text-slate-700">Services</h2>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={index} className="flex flex-col items-center gap-3 cursor-pointer group">
                <div className="flex items-center justify-center w-[100px] h-[100px] bg-white rounded-[20px] shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all">
                  <Icon className={`size-8 ${service.color}`} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-slate-600 text-center max-w-[90px] leading-snug group-hover:text-slate-900 transition-colors">
                  {service.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
