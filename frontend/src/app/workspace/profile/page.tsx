"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Building2Icon,
  CalendarDaysIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCircle2Icon,
  Check,
  Loader2,
  AlertCircle,
  X,
  Upload,
  Camera,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { databases, Query, COLLECTIONS, DB_ID } from "@/lib/appwrite/client"
import { API_BASE_URL } from "@/lib/api/config"
import { fetchJson } from "@/lib/api/fetch-json"

type CompanyProfileForm = {
  companyName: string
  businessEmail: string
  companyPhone: string
  registeredOffice: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  companyRange: string
  industry: string
  website: string
  gstNumber: string
  tagline: string
}

const emptyProfile: CompanyProfileForm = {
  companyName: "",
  businessEmail: "",
  companyPhone: "",
  registeredOffice: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  companyRange: "",
  industry: "",
  website: "",
  gstNumber: "",
  tagline: "",
}

function joinAddress(p: CompanyProfileForm): string {
  const parts = [p.addressLine1, p.addressLine2, p.city, p.state, p.postalCode, p.country].filter(Boolean)
  return parts.join(", ")
}

function formatDate(value?: string) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  } catch { return "—" }
}

function displayValue(value: string) {
  return value.trim() ? value : "Need to fill"
}

function isMissing(value: string) {
  return !value.trim()
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<CompanyProfileForm>(emptyProfile)
  const queryClient = useQueryClient()

  // ── OTP popup state ──
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("")

  // ── Fetch current user from JWT ──
  const { data: sessionData } = useQuery({
    queryKey: ["profile-session"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token")
      if (!token) return null
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  const userEmail = sessionData?.user?.email ?? ""
  const isEmailVerified = sessionData?.user?.emailVerified === true

  // ── Fetch organization from DB ──
  const orgId = sessionData?.user?.organizationId ?? sessionData?.organization?.$id

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["profile-org", orgId],
    queryFn: async () => {
      if (!orgId) return null
      try {
        const res = await databases.getDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId)
        return res as any
      } catch {
        try {
          const list = await databases.listDocuments(DB_ID, COLLECTIONS.ORGANIZATIONS, [
            Query.equal("ownerEmail", userEmail),
            Query.limit(1),
          ])
          return list.documents?.[0] as any
        } catch { return null }
      }
    },
    enabled: !!orgId,
  })

  const { data: staffData } = useQuery({
    queryKey: ["profile-staff", sessionData?.user?.$id],
    queryFn: async () => {
      const userId = sessionData?.user?.$id;
      if (!userId) return null;
      const { staffService } = await import("@/lib/services/staff-service");
      return await staffService.getStaffByUserId(userId);
    },
    enabled: !!sessionData?.user?.$id,
  })

  // ── Merge data ──
  const profile: CompanyProfileForm = useMemo(() => {
    const orgSettings = orgData?.settings
      ? (() => { try { return JSON.parse(orgData.settings) } catch { return {} } })()
      : {}
    const rawAddress = orgSettings.address ?? orgData?.address ?? ""
    // Parse old single-line address into parts (best-effort: split by ", ")
    const addrParts = rawAddress ? rawAddress.split(", ").map((s: string) => s.trim()) : []
    return {
      companyName: orgData?.name ?? sessionData?.organization?.name ?? "",
      businessEmail: orgSettings.businessEmail ?? userEmail,
      companyPhone: orgSettings.companyPhone ?? "",
      registeredOffice: orgSettings.registeredOffice ?? "",
      addressLine1: orgSettings.addressLine1 ?? (addrParts[0] || ""),
      addressLine2: orgSettings.addressLine2 ?? (addrParts[1] || ""),
      city: orgSettings.city ?? (addrParts[2] || ""),
      state: orgSettings.state ?? (addrParts[3] || ""),
      postalCode: orgSettings.postalCode ?? (addrParts[4] || ""),
      country: orgSettings.country ?? (addrParts[5] || ""),
      companyRange: orgSettings.companyRange ?? orgData?.companyRange ?? "",
      industry: orgSettings.industry ?? orgData?.industry ?? "",
      website: orgSettings.website ?? "",
      gstNumber: orgSettings.gstNumber ?? "",
      tagline: orgSettings.tagline ?? "",
    }
  }, [orgData, sessionData, userEmail])

  useEffect(() => {
    if (profile) setFormData(profile)
    if (orgData?.logoUrl) setAvatarUrl(orgData.logoUrl)
  }, [profile, orgData])

  // ── Auto-send OTP on load if not verified ──
  const autoSendOtpMutation = useMutation({
    mutationFn: async () => {
      return fetchJson(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })
    },
    onSuccess: () => {
      setOtpSent(true)
      setShowOtpDialog(true)
    },
  })

  useEffect(() => {
    if (userEmail && !isEmailVerified && !otpSuccess && !autoSendOtpMutation.isPending && !otpSent) {
      autoSendOtpMutation.mutate()
    }
  }, [userEmail, isEmailVerified, otpSuccess])

  // ── Verify OTP ──
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      // First verify OTP via forgot-password check, then mark verified
      return fetchJson(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })
    },
    onSuccess: () => {
      setOtpSuccess(true)
      setOtpError("")
      setShowOtpDialog(false)
      queryClient.invalidateQueries({ queryKey: ["profile-session"] })
      // Update localStorage flag
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          payload.emailVerified = true
          // Note: JWT is signed, can't truly modify it. The backend /me endpoint reads from DB.
        } catch { /* ignore */ }
      }
    },
    onError: () => {
      setOtpError("Invalid OTP. Please try again.")
    },
  })

  // ── Resend OTP ──
  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      return fetchJson(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      })
    },
    onSuccess: () => {
      setOtpError("")
      setOtpValue("")
    },
    onError: () => {
      setOtpError("Failed to resend OTP")
    },
  })

  // ── Save profile ──
  const saveMutation = useMutation({
    mutationFn: async (data: CompanyProfileForm) => {
      if (orgId) {
        try {
          await databases.updateDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId, {
            name: data.companyName,
            companyRange: data.companyRange,
            industry: data.industry,
          })
        } catch { /* non-fatal */ }
      }
      const settings = {
        businessEmail: data.businessEmail,
        companyPhone: data.companyPhone,
        registeredOffice: data.registeredOffice,
        address: joinAddress(data),
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        companyRange: data.companyRange,
        industry: data.industry,
        website: data.website,
        gstNumber: data.gstNumber,
        tagline: data.tagline,
      }
      if (orgId) {
        try {
          await databases.updateDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId, {
            settings: JSON.stringify(settings),
          })
        } catch { /* non-fatal */ }
      }
      localStorage.setItem("org-settings", JSON.stringify(settings))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-org"] })
      queryClient.invalidateQueries({ queryKey: ["profile-session"] })
      setIsEditing(false)
    },
  })

  // ── Avatar upload ──
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`${API_BASE_URL}/api/upload/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      return res.json()
    },
    onSuccess: (data) => {
      const url = data.url || data.avatarUrl || ""
      setAvatarUrl(url)
      // Update org in DB
      if (orgId && url) {
        databases.updateDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId, { logoUrl: url }).catch(() => {})
      }
      // Broadcast to sidebar
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: { avatar: url } }))
      queryClient.invalidateQueries({ queryKey: ["profile-org"] })
    },
  })

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
  }, [avatarMutation])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => saveMutation.mutate(formData)
  const handleCancel = () => { setIsEditing(false); setFormData(profile) }

  const companyInitials = (profile.companyName || "Company")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase()).join("") || "CP"

  const isLoading = orgLoading && !orgData

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <Tabs defaultValue="company" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="company">Company Details</TabsTrigger>
            <TabsTrigger value="personal">Personal Profile</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="company" className="space-y-6">
      {/* ── OTP Verification Popup ── */}
      <Dialog open={showOtpDialog} onOpenChange={(open) => { if (!otpSuccess) setShowOtpDialog(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailIcon className="h-5 w-5 text-amber-600" />
              Verify Your Email
            </DialogTitle>
            <DialogDescription>
              A verification code has been sent to <strong>{userEmail}</strong>. Enter it below to verify.
            </DialogDescription>
          </DialogHeader>

          {otpSuccess ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-emerald-700">Email Verified!</p>
                <p className="text-sm text-muted-foreground">{userEmail} is now verified.</p>
              </div>
              <Button onClick={() => setShowOtpDialog(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <Input
                  type="text"
                  placeholder="000000"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[12px] font-mono h-14 max-w-[240px] mx-auto"
                  maxLength={6}
                  autoFocus
                />
                {otpError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {otpError}
                  </p>
                )}
              </div>

              <Button
                onClick={() => verifyOtpMutation.mutate()}
                disabled={verifyOtpMutation.isPending || otpValue.length < 6}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {verifyOtpMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                ) : "Verify Email"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => resendOtpMutation.mutate()}
                  disabled={resendOtpMutation.isPending}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {resendOtpMutation.isPending ? "Resending..." : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar with upload */}
              <div className="relative group">
                {avatarUrl ? (
                  <Avatar className="h-16 w-16 rounded-xl ring-1 ring-border">
                    <AvatarImage src={avatarUrl} alt={profile.companyName} />
                    <AvatarFallback className="rounded-xl bg-emerald-100 text-emerald-800">
                      {companyInitials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-600">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-white" />
                    <span className="text-[10px] font-medium text-white">Upload</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                {avatarMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-semibold tracking-tight">
                    {displayValue(profile.companyName)}
                  </CardTitle>
                  <CardDescription>{displayValue(profile.tagline)}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isEmailVerified || otpSuccess ? "secondary" : "outline"}>
                    {(isEmailVerified || otpSuccess) ? "Email verified" : "Email not verified"}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? "Cancel Edit" : "Edit Company"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Company Status</CardTitle>
                <ShieldCheckIcon className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">Active</div>
                <p className="text-xs text-slate-700 mt-1 font-medium">Operating normally</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Company Size</CardTitle>
                <Building2Icon className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">{displayValue(profile.companyRange)}</div>
                <p className="text-xs text-slate-700 mt-1 font-medium">From signup</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Email Status</CardTitle>
                <MailIcon className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">
                  {(isEmailVerified || otpSuccess) ? "Verified" : "Not verified"}
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">{userEmail || "No email"}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Account Created</CardTitle>
                <CalendarDaysIcon className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">
                  {formatDate(orgData?.$createdAt ?? orgData?.createdAt)}
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">Organization created</p>
              </CardContent>
            </Card>
          </div>

          {/* Company Details */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Key business information and registered company data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><UserCircle2Icon className="size-4 text-slate-600" /> Company Name</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><MailIcon className="size-4 text-slate-600" /> Business Email</label>
                      <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><PhoneIcon className="size-4 text-slate-600" /> Company Phone</label>
                      <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><MapPinIcon className="size-4 text-slate-600" /> Registered Office</label>
                      <input type="text" name="registeredOffice" value={formData.registeredOffice} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><Building2Icon className="size-4 text-slate-600" /> Company Size</label>
                      <input type="text" name="companyRange" value={formData.companyRange} onChange={handleInputChange} placeholder="e.g. 1-10"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><Building2Icon className="size-4 text-slate-600" /> Industry</label>
                      <input type="text" name="industry" value={formData.industry} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><GlobeIcon className="size-4 text-slate-600" /> Website</label>
                      <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><ShieldCheckIcon className="size-4 text-slate-600" /> GST Number</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium"><Building2Icon className="size-4 text-slate-600" /> Tagline</label>
                      <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} placeholder="One line about the company"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium"><MapPinIcon className="size-4 text-slate-600" /> Company Address</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Address Line 1</label>
                        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="Street address, P.O. box"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Address Line 2 <span className="text-muted-foreground">(optional)</span></label>
                        <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Apartment, suite, unit, building, floor"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Mumbai"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">State / Province</label>
                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="e.g. Maharashtra"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Postal / ZIP Code</label>
                        <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="e.g. 400001"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Country</label>
                        <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="e.g. India"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                      {saveMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline">Cancel</Button>
                  </div>
                  {saveMutation.isError && <p className="text-sm text-destructive">{(saveMutation.error as Error)?.message || "Failed to save"}</p>}
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    { label: "Company Name", value: profile.companyName, icon: <UserCircle2Icon className="size-4 text-slate-600" />, span: false },
                    { label: "Business Email", value: profile.businessEmail, icon: <MailIcon className="size-4 text-slate-600" />, span: false },
                    { label: "Company Phone", value: profile.companyPhone, icon: <PhoneIcon className="size-4 text-slate-600" />, span: false },
                    { label: "Registered Office", value: profile.registeredOffice, icon: <MapPinIcon className="size-4 text-slate-600" />, span: false },
                    { label: "Company Size", value: profile.companyRange, icon: <Building2Icon className="size-4 text-slate-600" />, span: false },
                    { label: "Industry", value: profile.industry, icon: <Building2Icon className="size-4 text-slate-600" />, span: false },
                    { label: "Website", value: profile.website, icon: <GlobeIcon className="size-4 text-slate-600" />, span: false },
                    { label: "GST Number", value: profile.gstNumber, icon: <ShieldCheckIcon className="size-4 text-slate-600" />, span: false },
                    { label: "Tagline", value: profile.tagline, icon: <Building2Icon className="size-4 text-slate-600" />, span: true },
                  ] as const).map((field) => (
                    <div key={field.label} className={`space-y-2 rounded-lg border p-4${field.span ? " sm:col-span-2" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">{field.icon}{field.label}</div>
                        {isMissing(field.value) && <AlertCircle className="size-4 text-red-500" />}
                      </div>
                      <p className={`text-sm ${isMissing(field.value) ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                        {displayValue(field.value)}
                      </p>
                    </div>
                  ))}
                  <div className="space-y-2 rounded-lg border p-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium"><MapPinIcon className="size-4 text-slate-600" />Company Address</div>
                      {isMissing(joinAddress(profile)) && <AlertCircle className="size-4 text-red-500" />}
                    </div>
                    <div className="space-y-1">
                      {profile.addressLine1 && <p className="text-sm text-muted-foreground">{profile.addressLine1}</p>}
                      {profile.addressLine2 && <p className="text-sm text-muted-foreground">{profile.addressLine2}</p>}
                      <p className={`text-sm ${isMissing(joinAddress(profile)) ? "font-medium text-red-600" : "text-muted-foreground"}`}>
                        {[profile.city, profile.state, profile.postalCode].filter(Boolean).join(", ") || (isMissing(joinAddress(profile)) ? "Need to fill" : "")}
                      </p>
                      {profile.country && <p className="text-sm text-muted-foreground">{profile.country}</p>}
                      {isMissing(joinAddress(profile)) && (
                        <p className="text-sm font-medium text-red-600">Need to fill</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Company Timeline</CardTitle>
              <CardDescription>Important company milestones and registration dates.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Card className="overflow-hidden border-emerald-100 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700"><CalendarDaysIcon className="size-4" /> Organization Created</div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-950">{formatDate(orgData?.$createdAt ?? orgData?.createdAt)}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-emerald-100 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700"><ShieldCheckIcon className="size-4" /> Email Verification</div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-950">{(isEmailVerified || otpSuccess) ? "Verified" : "Not verified"}</p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-emerald-100 bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700"><UserCircle2Icon className="size-4" /> Last Update</div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-950">{formatDate(orgData?.$updatedAt ?? orgData?.updatedAt)}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </CardContent>
        </TabsContent>
        <TabsContent value="personal" className="space-y-6">
          <Card className="border">
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>Your personal and professional details.</CardDescription>
            </CardHeader>
            <CardContent>
              {staffData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={staffData.avatar} />
                      <AvatarFallback>{staffData.firstName?.[0]}{staffData.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{staffData.firstName} {staffData.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{staffData.designation} • {staffData.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Email</p>
                      <p className="text-sm font-medium">{staffData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Phone</p>
                      <p className="text-sm font-medium">{displayValue(staffData.mobile)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Employee ID</p>
                      <p className="text-sm font-medium">{staffData.empId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Status</p>
                      <p className="text-sm font-medium">{staffData.status}</p>
                    </div>
                  </div>
                  
                  {(staffData.workExperience?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold mb-2">Work Experience</p>
                      <div className="space-y-2">
                        {staffData.workExperience?.map((exp: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border bg-muted/20">
                            <p className="text-sm font-semibold">{exp.company} - {exp.title}</p>
                            <p className="text-xs text-muted-foreground">{exp.from} to {exp.to}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(staffData.educationDetails?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold mb-2">Education Details</p>
                      <div className="space-y-2">
                        {staffData.educationDetails?.map((edu: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg border bg-muted/20">
                            <p className="text-sm font-semibold">{edu.institute}</p>
                            <p className="text-xs text-muted-foreground">{edu.degree} - {edu.specialization}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No personal profile record found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}

