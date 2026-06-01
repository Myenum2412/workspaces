"use client"

import * as React from "react"
import {
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  Settings2,
  Building2,
  Globe,
  Heart,
  CreditCard,
  History,
  SaveIcon,
  Users,
} from "lucide-react"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const MASTER_CATEGORIES = [
  { id: "work", label: "Work", icon: Building2, lists: ["Departments", "Locations", "Designations", "Roles", "Employment Types", "Employee Status"] },
  { id: "personal", label: "Personal", icon: Heart, lists: ["Gender", "Marital Status", "Source of Hire", "Relationships"] },
  { id: "geography", label: "Geography", icon: Globe, lists: ["Countries", "States"] },
  { id: "financial", label: "Financial", icon: CreditCard, lists: ["Payment Modes"] },
  { id: "account", label: "Account", icon: Users, lists: ["User Categories"] },
]

const DEFAULT_DATA: Record<string, string[]> = {
  "Departments": ["Engineering", "HR", "Sales", "Marketing", "Finance"],
  "User Categories": ["Software", "Hotel", "Hospital", "Education", "Retail", "Manufacturing", "Finance", "Real Estate", "Restaurant", "Other"],
  "Locations": ["Remote", "Headquarters", "New York Office", "London Hub"],
  "Designations": ["Software Engineer", "Senior Developer", "Product Manager", "HR Specialist", "Sales Lead"],
  "Roles": ["Admin", "Manager", "User", "Lead"],
  "Employment Types": ["Full Time", "Part Time", "Contract", "Trainee", "Freelance"],
  "Employee Status": ["Active", "Inactive", "On Leave", "Terminated"],
  "Gender": ["Male", "Female", "Other", "Prefer not to say"],
  "Marital Status": ["Single", "Married", "Divorced", "Widowed"],
  "Source of Hire": ["LinkedIn", "Referral", "Job Board", "Direct Application"],
  "Relationships": ["Spouse", "Child", "Parent", "Sibling"],
  "Countries": ["India", "USA", "UK", "Canada", "Germany"],
  "States": ["Karnataka", "California", "London", "Ontario", "Berlin"],
  "Payment Modes": ["Bank Transfer", "Cheque", "Cash", "UPI"],
}

function mergeData(saved: Record<string, any>): Record<string, string[]> {
  const merged = { ...DEFAULT_DATA }
  for (const [key, value] of Object.entries(saved)) {
    if (Array.isArray(value) && value.length > 0) {
      merged[key] = value
    }
  }
  return merged
}

interface MasterDataManagementProps {
  orgSettings: Record<string, any>
}

export function MasterDataManagement({ orgSettings }: MasterDataManagementProps) {
  const [data, setData] = React.useState<Record<string, string[]>>(() => {
    let localStorageData: Record<string, any> = {}
    try {
      const stored = localStorage.getItem("master-data")
      if (stored) localStorageData = JSON.parse(stored)
    } catch { /* ignore */ }
    return mergeData({ ...(orgSettings.masterData ?? {}), ...localStorageData })
  })
  const [activeCategory, setActiveCategory] = React.useState("work")
  const [activeList, setActiveList] = React.useState("Departments")
  const [newItem, setNewItem] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Sync data when orgSettings change (e.g. after save reload)
  React.useEffect(() => {
    setData(mergeData(orgSettings.masterData ?? {}))
  }, [orgSettings])

  const currentLists = MASTER_CATEGORIES.find((c) => c.id === activeCategory)?.lists || []

  // Reset activeList when category changes
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId)
    const lists = MASTER_CATEGORIES.find((c) => c.id === catId)?.lists || []
    setActiveList(lists[0] || "")
    setSearchQuery("")
  }

  const handleAddItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed || data[activeList]?.includes(trimmed)) return
    setData((prev) => ({ ...prev, [activeList]: [...(prev[activeList] || []), trimmed] }))
    setNewItem("")
  }

  const handleRemoveItem = (item: string) => {
    setData((prev) => ({
      ...prev,
      [activeList]: (prev[activeList] || []).filter((i) => i !== item),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem("master-data", JSON.stringify(data))
      toast.success("Master data saved successfully")
    } catch (err) {
      console.error("Error saving master data:", err)
      toast.error("Failed to save master data")
    } finally {
      setSaving(false)
    }
  }

  const filteredItems =
    data[activeList]?.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())) || []

  return (
    <div className="space-y-8 font-poppins">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2 text-primary">
            <Settings2 className="size-6 text-slate-600" />
            Master Data Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure global dropdown options and lookup lists used across the application.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80">
          <SaveIcon className="size-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/10/50 bg-emerald-50/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-emerald-800">Categories</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 space-y-1">
              {MASTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                    activeCategory === cat.id
                      ? "bg-bg-primary text-primary-foreground -emerald-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <cat.icon className="size-4" />
                  {cat.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Available Lists</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 space-y-1">
              {currentLists.map((list) => (
                <button
                  key={list}
                  onClick={() => { setActiveList(list); setSearchQuery("") }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeList === list
                      ? "bg-white border-2 border-emerald-500 text-slate-700"
                      : "text-slate-600 hover:bg-slate-50 border-2 border-transparent"
                  )}
                >
                  {list}
                  <Badge variant="secondary" className="bg-slate-50 text-slate-700 border-primary/20 text-[10px]">
                    {data[list]?.length || 0}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          <Card className="border-none bg-white min-h-[600px] flex flex-col overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="font-heading text-xl font-bold text-slate-900">{activeList}</CardTitle>
                  <CardDescription>Manage current values for {activeList.toLowerCase()}.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="pl-9 w-[240px] h-9 rounded-full bg-white border-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-8">
              <div className="space-y-8">
                {/* Add New Item */}
                <div className="flex gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary ml-1">Add New Entry</Label>
                    <Input
                      placeholder={`Enter new ${activeList.toLowerCase().replace(/s$/, "")}...`}
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                      className="h-11 rounded-xl bg-white border-slate-200 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddItem}
                      className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/80 -emerald-100 font-bold"
                    >
                      <PlusIcon className="size-4 mr-2" />
                      Add to List
                    </Button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Values</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-primary/10 px-2 py-0.5 rounded-full uppercase">Alpha Sort</span>
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredItems.map((item) => (
                          <div
                            key={item}
                            className="flex items-center justify-between p-4 rounded-xl border bg-white hover:border-slate-200 hover:bg-primary/5 transition-all group"
                          >
                            <span className="text-sm font-bold text-slate-700">{item}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item)}
                              className="size-8 rounded-lg text-muted-foreground hover:text-slate-600 hover:bg-slate-50"
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        ))}
                      {filteredItems.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <SearchIcon className="size-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-bold">No items found</p>
                          <p className="text-xs text-slate-400">Try adjusting your search or add a new item above.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>

            <div className="p-6 border-t bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <History className="size-3" />
                Changes saved locally on click "Save All"
              </div>
              <p className="text-[11px] font-medium text-slate-500 italic">
                Changes will be reflected across all forms instantly.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
