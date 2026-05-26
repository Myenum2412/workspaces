"use client"

import * as React from "react"
import { PlusIcon, SearchIcon, Filter, Download, Building2, Mail, User, EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { MoreHorizontal } from "lucide-react"

import { useAnalytics } from "@/hooks/use-analytics"

interface BuyerUser {
  id: string
  companyName: string
  name: string
  email: string
  status: "Active" | "Inactive"
  createdAt: string
}

const INITIAL_DATA: BuyerUser[] = [
  {
    id: "1",
    companyName: "Acme Corporation",
    name: "John Smith",
    email: "john@acme.com",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    companyName: "TechStart Inc",
    name: "Sarah Johnson",
    email: "sarah@techstart.io",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    companyName: "Global Ventures",
    name: "Michael Chen",
    email: "m.chen@globalventures.com",
    status: "Inactive",
    createdAt: "2024-03-10",
  },
]

export default function BuyersUsersPage() {
  const { trackEvent } = useAnalytics("BuyersUsersPage")
  const [buyers, setBuyers] = React.useState<BuyerUser[]>(INITIAL_DATA)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [companyName, setCompanyName] = React.useState("")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  const getStrength = (pass: string) => {
    if (pass.length === 0) return 0
    if (pass.length < 6) return 33
    if (pass.length < 10) return 66
    return 100
  }

  const strength = getStrength(password)

  const handleAddBuyer = async () => {
    if (!companyName || !name || !email || !password) {
      return
    }

    setIsSubmitting(true)
    trackEvent('add_buyer_user_start')

    try {
      const newBuyer: BuyerUser = {
        id: Date.now().toString(),
        companyName,
        name,
        email,
        status: "Active",
        createdAt: new Date().toISOString().split('T')[0],
      }

      setBuyers(prev => [newBuyer, ...prev])

      trackEvent('add_buyer_user_success')

      // Reset form and close dialog
      setCompanyName("")
      setName("")
      setEmail("")
      setPassword("")
      setIsAddDialogOpen(false)
    } catch (error) {
      trackEvent('add_buyer_user_error')
      console.error('Failed to add buyer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBuyers = buyers.filter(buyer =>
    buyer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buyer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Buyers & Users
              </CardTitle>
              <CardDescription>
                Manage buyer accounts and user access.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700  -emerald-100 font-bold">
                  <PlusIcon className="mr-2 size-4" />
                  Add New Buyer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Buyer & User</DialogTitle>
                  <DialogDescription>
                    Create a new buyer account with company and user details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <FieldSet>
                    <FieldLegend>Company Information</FieldLegend>
                    <Field className="mt-2">
                      <FieldLabel>Company Name</FieldLabel>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter company name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </Field>
                  </FieldSet>

                  <Separator />

                  <FieldSet>
                    <FieldLegend>User Information</FieldLegend>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field className="sm:col-span-2">
                        <FieldLabel>Full Name</FieldLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </Field>
                      <Field className="sm:col-span-2">
                        <FieldLabel>Email Address</FieldLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </Field>
                      <Field className="sm:col-span-2">
                        <FieldLabel>Password</FieldLabel>
                        <div className="relative group">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10 focus-visible:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>

                          {/* Strength Meter */}
                          <div className="mt-2 flex gap-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full"
                            />
                          </div>
                          {password.length > 0 && (
                              <p
                                className="text-[10px] font-bold uppercase tracking-wider mt-1 text-right"
                                style={{ color: strength <= 33 ? "#ef4444" : strength <= 66 ? "#f59e0b" : "#10b981" }}
                              >
                                {strength <= 33 ? "Weak" : strength <= 66 ? "Medium" : "Strong"}
                              </p>
                            )}
                        </div>
                      </Field>
                    </div>
                  </FieldSet>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleAddBuyer}
                    disabled={isSubmitting || !companyName || !name || !email || !password}
                  >
                    {isSubmitting ? "Creating..." : "Create Buyer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border ">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 border-none h-11"
              />
            </div>
            <Button variant="outline" className="h-11 border-slate-200">
              <Filter className="mr-2 size-4" />
              Filters
            </Button>
            <Button variant="outline" className="h-11 border-slate-200">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>

          {/* Buyer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBuyers.map((buyer, index) => (
              <div
                key={buyer.id}
              >
                <Card className="overflow-hidden border-emerald-100 bg-card  group">
                  <div className="h-2 bg-emerald-500" />
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-heading text-xl font-bold text-slate-900">
                          {buyer.companyName}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <Building2 className="size-3" />
                          {buyer.email}
                        </p>
                      </div>
                      <Badge
                        variant={buyer.status === "Active" ? "default" : "secondary"}
                        className={buyer.status === "Active" ? "bg-emerald-100 text-slate-700 hover:bg-emerald-200" : ""}
                      >
                        {buyer.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-emerald-100">
                        <div className="size-8 rounded-lg bg-white flex items-center justify-center  font-bold text-slate-600">
                          {buyer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{buyer.name}</p>
                          <p className="text-xs text-slate-400 font-medium">Primary Contact</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <a href={`mailto:${buyer.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50/50">
                          <Mail className="size-4 text-slate-500" />
                          {buyer.email}
                        </a>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        Added: {new Date(buyer.createdAt).toLocaleDateString()}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-50">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Buyer</DropdownMenuItem>
                          <DropdownMenuItem>Deactivate</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {filteredBuyers.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No buyers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "Get started by adding a new buyer"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
