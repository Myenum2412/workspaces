"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Building2Icon,
  CalendarDaysIcon,
  Clock,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCircle2Icon,
  Check,
  Loader2,
  AlertCircle,
  Upload,
  Camera,
  History,
  Download,
  Activity,
  SmartphoneIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/api/config";
import { profileApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useProfileSocket } from "@/hooks/use-profile-socket";

// ── Types ───────────────────────────────────────────────────
type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  bio: string;
  personalEmail: string;
  personalPhone: string;
  avatarUrl: string;
  gender: string;
  maritalStatus: string;
  dob: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  addressPostalCode: string;
  permanentAddress: string;
  expertise: string;
};

const emptyProfile: ProfileForm = {
  firstName: "", lastName: "", email: "", phone: "", designation: "",
  department: "", bio: "", personalEmail: "", personalPhone: "", avatarUrl: "",
  gender: "", maritalStatus: "", dob: "", addressStreet: "", addressCity: "",
  addressState: "", addressCountry: "", addressPostalCode: "",
  permanentAddress: "", expertise: "",
};

// ── Helpers ─────────────────────────────────────────────────
function displayValue(value: string) {
  return value?.trim() ? value : "Need to fill";
}

function isMissing(value: string) {
  return !value?.trim();
}

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(value));
  } catch { return "—" }
}

function fmtDur(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Main Component ──────────────────────────────────────────
export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>(emptyProfile);
  const [avatarUrl, setAvatarUrl] = useState("");
  const queryClient = useQueryClient();

  // Real-time socket sync
  useProfileSocket();

  // ── OTP popup state ──
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);

  // ── Session history tab ──
  const [statusTab, setStatusTab] = useState<"today" | "week">("today");

  // ── Fetch session ──
  const { data: sessionData } = useQuery({
    queryKey: ["profile-session"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const userEmail = sessionData?.user?.email ?? "";
  const isEmailVerified = sessionData?.user?.emailVerified === true;

  // ── Fetch profile via profileApi ──
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: profileApi.get,
    enabled: !!sessionData,
  });

  const profileRaw = profileRes?.profile;

  // ── Flatten profile for form ──
  const profile: ProfileForm = React.useMemo(() => {
    if (!profileRaw) return emptyProfile;
    return {
      firstName: profileRaw.firstName ?? "",
      lastName: profileRaw.lastName ?? "",
      email: profileRaw.email ?? "",
      phone: profileRaw.phone ?? "",
      designation: profileRaw.designation ?? "",
      department: profileRaw.department ?? "",
      bio: profileRaw.bio ?? "",
      personalEmail: profileRaw.personalEmail ?? "",
      personalPhone: profileRaw.personalPhone ?? "",
      avatarUrl: profileRaw.avatarUrl ?? "",
      gender: profileRaw.gender ?? "",
      maritalStatus: profileRaw.maritalStatus ?? "",
      dob: profileRaw.dob ?? "",
      addressStreet: profileRaw.address?.street ?? "",
      addressCity: profileRaw.address?.city ?? "",
      addressState: profileRaw.address?.state ?? "",
      addressCountry: profileRaw.address?.country ?? "",
      addressPostalCode: profileRaw.address?.postalCode ?? "",
      permanentAddress: profileRaw.permanentAddress ?? "",
      expertise: Array.isArray(profileRaw.expertise) ? profileRaw.expertise.join(", ") : "",
    };
  }, [profileRaw]);

  useEffect(() => {
    if (profile) setFormData(profile);
    if (profile?.avatarUrl) setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  // ── Profile completion ──
  const completion = profileRaw?.profileCompletion ?? 0;

  // ── Status history ──
  const { data: statusHistory } = useQuery({
    queryKey: ["status-history", statusTab],
    queryFn: async () => {
      const days = statusTab === "today" ? 1 : 7;
      const res = await fetch(`${API_BASE_URL}/api/auth/status/history?days=${days}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // ── Profile history ──
  const { data: historyRes } = useQuery({
    queryKey: queryKeys.profileHistory(1),
    queryFn: () => profileApi.getHistory(1, 20),
    enabled: !!profileRaw,
  });

  // ── Activity log ──
  const { data: activityRes } = useQuery({
    queryKey: queryKeys.profileActivity(),
    queryFn: () => profileApi.getActivity(30),
    enabled: !!profileRaw,
  });

  // ── Auto-send OTP ──
  const autoSendOtpMutation = useMutation({
    mutationFn: async () => {
      return fetch(`${API_BASE_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      }).then((r) => r.json());
    },
    onSuccess: () => { setOtpSent(true); setShowOtpDialog(true); },
  });

  useEffect(() => {
    const hasAsked = sessionStorage.getItem("verification_asked") === "true";
    if (userEmail && !isEmailVerified && !otpSuccess && !autoSendOtpMutation.isPending && !otpSent && !hasAsked) {
      sessionStorage.setItem("verification_asked", "true");
      autoSendOtpMutation.mutate();
    }
  }, [userEmail, isEmailVerified, otpSuccess]);

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      return fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      }).then((r) => r.json());
    },
    onSuccess: () => {
      setOtpSuccess(true); setOtpError(""); setShowOtpDialog(false);
      queryClient.invalidateQueries({ queryKey: ["profile-session"] });
      toast.success("Email verified successfully");
    },
    onError: () => { setOtpError("Invalid OTP. Please try again."); },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      return fetch(`${API_BASE_URL}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      }).then((r) => r.json());
    },
    onSuccess: () => { setOtpError(""); setOtpValue(""); },
    onError: () => { setOtpError("Failed to resend OTP"); },
  });

  // ── Save profile ──
  const saveMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const payload: Record<string, unknown> = {};
      if (data.firstName.trim()) payload.firstName = data.firstName.trim();
      if (data.lastName.trim()) payload.lastName = data.lastName.trim();
      if (data.phone.trim()) payload.phone = data.phone.trim();
      if (data.designation.trim()) payload.designation = data.designation.trim();
      if (data.department.trim()) payload.department = data.department.trim();
      if (data.bio.trim()) payload.bio = data.bio.trim();
      if (data.personalEmail.trim()) payload.personalEmail = data.personalEmail.trim();
      if (data.personalPhone.trim()) payload.personalPhone = data.personalPhone.trim();
      if (data.gender) payload.gender = data.gender;
      if (data.maritalStatus.trim()) payload.maritalStatus = data.maritalStatus.trim();
      if (data.dob.trim()) payload.dob = data.dob.trim();

      // Build address subdocument (only include if at least one field filled)
      const addr: Record<string, string> = {};
      if (data.addressStreet.trim()) addr.street = data.addressStreet.trim();
      if (data.addressCity.trim()) addr.city = data.addressCity.trim();
      if (data.addressState.trim()) addr.state = data.addressState.trim();
      if (data.addressCountry.trim()) addr.country = data.addressCountry.trim();
      if (data.addressPostalCode.trim()) addr.postalCode = data.addressPostalCode.trim();
      if (Object.keys(addr).length > 0) payload.address = addr;

      if (data.permanentAddress.trim()) payload.permanentAddress = data.permanentAddress.trim();

      if (data.expertise.trim()) {
        payload.expertise = data.expertise.split(",").map((s) => s.trim()).filter(Boolean);
      }

      return profileApi.update(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileHistory(1) });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  // ── Avatar upload ──
  const avatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (data) => {
      const url = data.avatarUrl || "";
      setAvatarUrl(url);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: { avatar: url } }));
      toast.success("Avatar updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Avatar upload failed");
    },
  });

  // ── Export ──
  const handleExport = useCallback(async () => {
    try {
      const data = await profileApi.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profile-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Profile exported");
    } catch {
      toast.error("Export failed");
    }
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  }, [avatarMutation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => saveMutation.mutate(formData);
  const handleCancel = () => { setIsEditing(false); setFormData(profile); };

  const statusColor: Record<string, string> = {
    Online: "bg-primary", "Lunch Break": "bg-amber-500", "In a Meeting": "bg-blue-500",
    Away: "bg-orange-500", Offline: "bg-slate-300", Leave: "bg-red-500",
  };

  const initials = (profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "") || "U";

  if (profileLoading && !profileRaw) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
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
                <Check className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-primary">Email Verified!</p>
                <p className="text-sm text-muted-foreground">{userEmail} is now verified.</p>
              </div>
              <Button onClick={() => setShowOtpDialog(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <Input type="text" placeholder="000000" value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[12px] font-mono h-14 max-w-[240px] mx-auto" maxLength={6} autoFocus />
                {otpError && <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {otpError}
                </p>}
              </div>
              <Button onClick={() => verifyOtpMutation.mutate()}
                disabled={verifyOtpMutation.isPending || otpValue.length < 6}
                className="w-full bg-primary hover:bg-primary/80">
                {verifyOtpMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify Email"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => resendOtpMutation.mutate()}
                  disabled={resendOtpMutation.isPending}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
                  {resendOtpMutation.isPending ? "Resending..." : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="personal" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="personal">Personal Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="status">My Status</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" /> Export
            </Button>
            <Button onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
              variant={isEditing ? "outline" : "default"}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PERSONAL PROFILE TAB                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="personal" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative group">
                    {avatarUrl || profile.avatarUrl ? (
                      <Avatar className="h-16 w-16 rounded-xl ring-1 ring-border">
                        <AvatarImage 
                          src={(avatarUrl || profile.avatarUrl).startsWith("http") ? (avatarUrl || profile.avatarUrl) : `${API_BASE_URL}${avatarUrl || profile.avatarUrl}`} 
                          alt={profile.firstName} 
                        />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-emerald-800">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary">
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
                        {displayValue(`${profile.firstName} ${profile.lastName}`.trim())}
                      </CardTitle>
                      <CardDescription>{displayValue(profile.designation)}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={isEmailVerified || otpSuccess ? "secondary" : "outline"}>
                        {(isEmailVerified || otpSuccess) ? "Email verified" : "Email not verified"}
                      </Badge>
                      {profileRaw?.status && (
                        <Badge variant={profileRaw.status === "active" ? "secondary" : profileRaw.status === "suspended" ? "destructive" : "outline"}>
                          {profileRaw.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Profile Completion */}
              <Card className="border-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">Profile Completion</p>
                      <p className="text-xs text-muted-foreground">
                        Fill all fields to reach 100%
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary">{completion}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  {completion < 100 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isMissing(profile.firstName) && <Badge variant="outline" className="text-xs">First name</Badge>}
                      {isMissing(profile.phone) && <Badge variant="outline" className="text-xs">Phone</Badge>}
                      {isMissing(profile.designation) && <Badge variant="outline" className="text-xs">Designation</Badge>}
                      {isMissing(profile.bio) && <Badge variant="outline" className="text-xs">Bio</Badge>}
                      {isMissing(profile.avatarUrl) && <Badge variant="outline" className="text-xs">Avatar</Badge>}
                      {isMissing(profile.addressCity) && <Badge variant="outline" className="text-xs">City</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="overflow-hidden border-primary/20 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Account Status</CardTitle>
                    <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary capitalize">{profileRaw?.status ?? "active"}</div>
                    <p className="text-xs text-foreground mt-1 font-medium">Created {formatDate(profileRaw?.createdAt)}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-primary/20 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Last Login</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatDate(profileRaw?.lastLogin)}</div>
                    <p className="text-xs text-foreground mt-1 font-medium">{profileRaw?.loginCount ?? 0} total logins</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-primary/20 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Email Status</CardTitle>
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">
                      {(isEmailVerified || otpSuccess) ? "Verified" : "Not verified"}
                    </div>
                    <p className="text-xs text-foreground mt-1 font-medium">{userEmail || "No email"}</p>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-primary/20 bg-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Profile Version</CardTitle>
                    <History className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">v{profileRaw?.profileVersion ?? 1}</div>
                    <p className="text-xs text-foreground mt-1 font-medium">Updated {formatDate(profileRaw?.updatedAt)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details */}
              <Card className="border">
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Your personal and professional information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><UserCircle2Icon className="size-4 text-muted-foreground" /> First Name</label>
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><UserCircle2Icon className="size-4 text-muted-foreground" /> Last Name</label>
                          <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><PhoneIcon className="size-4 text-muted-foreground" /> Phone</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><Building2Icon className="size-4 text-muted-foreground" /> Designation</label>
                          <input type="text" name="designation" value={formData.designation} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><Building2Icon className="size-4 text-muted-foreground" /> Department</label>
                          <input type="text" name="department" value={formData.department} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><MailIcon className="size-4 text-muted-foreground" /> Personal Email</label>
                          <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><PhoneIcon className="size-4 text-muted-foreground" /> Personal Phone</label>
                          <input type="tel" name="personalPhone" value={formData.personalPhone} onChange={handleInputChange}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><CalendarDaysIcon className="size-4 text-muted-foreground" /> Date of Birth</label>
                          <input type="text" name="dob" value={formData.dob} onChange={handleInputChange} placeholder="YYYY-MM-DD"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <label className="flex items-center gap-2 text-sm font-medium"><UserCircle2Icon className="size-4 text-muted-foreground" /> Bio</label>
                          <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} placeholder="Short bio..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium"><MapPinIcon className="size-4 text-muted-foreground" /> Address</label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs text-muted-foreground">Street</label>
                            <input type="text" name="addressStreet" value={formData.addressStreet} onChange={handleInputChange}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">City</label>
                            <input type="text" name="addressCity" value={formData.addressCity} onChange={handleInputChange}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">State</label>
                            <input type="text" name="addressState" value={formData.addressState} onChange={handleInputChange}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Postal Code</label>
                            <input type="text" name="addressPostalCode" value={formData.addressPostalCode} onChange={handleInputChange}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Country</label>
                            <input type="text" name="addressCountry" value={formData.addressCountry} onChange={handleInputChange}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-primary hover:bg-primary/80">
                          {saveMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                        </Button>
                        <Button onClick={handleCancel} variant="outline">Cancel</Button>
                      </div>
                      {saveMutation.isError && <p className="text-sm text-destructive">{(saveMutation.error as Error)?.message}</p>}
                    </>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {([
                        { label: "First Name", value: profile.firstName, icon: <UserCircle2Icon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Last Name", value: profile.lastName, icon: <UserCircle2Icon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Phone", value: profile.phone, icon: <PhoneIcon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Designation", value: profile.designation, icon: <Building2Icon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Department", value: profile.department, icon: <Building2Icon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Personal Email", value: profile.personalEmail, icon: <MailIcon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Personal Phone", value: profile.personalPhone, icon: <PhoneIcon className="size-4 text-muted-foreground" />, span: false },
                        { label: "Bio", value: profile.bio, icon: <UserCircle2Icon className="size-4 text-muted-foreground" />, span: true },
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
                          <div className="flex items-center gap-2 text-sm font-medium"><MapPinIcon className="size-4 text-muted-foreground" /> Address</div>
                          {isMissing([profile.addressStreet, profile.addressCity, profile.addressCountry].join("")) && <AlertCircle className="size-4 text-red-500" />}
                        </div>
                        <div className="space-y-1">
                          {profile.addressStreet && <p className="text-sm text-muted-foreground">{profile.addressStreet}</p>}
                          {[profile.addressCity, profile.addressState, profile.addressPostalCode].filter(Boolean).join(", ") &&
                            <p className="text-sm text-muted-foreground">{[profile.addressCity, profile.addressState, profile.addressPostalCode].filter(Boolean).join(", ")}</p>}
                          {profile.addressCountry && <p className="text-sm text-muted-foreground">{profile.addressCountry}</p>}
                          {isMissing([profile.addressStreet, profile.addressCity, profile.addressCountry].join("")) &&
                            <p className="text-sm font-medium text-red-600">Need to fill</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Info */}
              {profileRaw?.deviceInfo && profileRaw.deviceInfo.length > 0 && (
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SmartphoneIcon className="h-4 w-4" /> Devices</CardTitle>
                    <CardDescription>Recent devices used to access your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profileRaw.deviceInfo.slice(-5).reverse().map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                          <SmartphoneIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{d.deviceType ?? "Device"} {d.browser && `• ${d.browser}`} {d.os && `on ${d.os}`}</p>
                            <p className="text-xs text-muted-foreground truncate">{d.userAgent}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(d.lastUsed)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ACTIVITY TAB                                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Account Activity</CardTitle>
              <CardDescription>Logins, profile changes, and account events.</CardDescription>
            </CardHeader>
            <CardContent>
              {activityRes?.activity && activityRes.activity.length > 0 ? (
                <div className="space-y-2">
                  {activityRes.activity.slice(0, 50).map((entry: any) => (
                    <div key={entry._id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize">{entry.action?.replace(/_/g, " ")}</p>
                        {entry.deviceInfo?.userAgent && (
                          <p className="text-xs text-muted-foreground truncate">{entry.deviceInfo.userAgent}</p>
                        )}
                        {entry.deviceInfo?.ip && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>IP: {entry.deviceInfo.ip}</span>
                            {entry.deviceInfo.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  {entry.deviceInfo.location}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATUS TAB                                               */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(statusHistory?.totals || {}).map(([status, seconds]) => (
              <Card key={status} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">{status}</CardTitle>
                  <div className={`h-3 w-3 rounded-full ${statusColor[status] || "bg-slate-300"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fmtDur(seconds as number)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusTab === "today" ? "Today" : "Last 7 days"}
                  </p>
                </CardContent>
              </Card>
            ))}
            {(!statusHistory?.totals || Object.keys(statusHistory.totals).length === 0) && (
              <Card className="sm:col-span-2 xl:col-span-4">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No status history yet.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant={statusTab === "today" ? "default" : "outline"} size="sm" onClick={() => setStatusTab("today")}>Today</Button>
            <Button variant={statusTab === "week" ? "default" : "outline"} size="sm" onClick={() => setStatusTab("week")}>Last 7 Days</Button>
          </div>

          {statusHistory?.daily && Object.keys(statusHistory.daily).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4" /> Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(statusHistory.daily).sort(([a], [b]) => b.localeCompare(a)).map(([date, statuses]) => (
                  <div key={date} className="space-y-2">
                    <p className="text-sm font-semibold text-slate-800">{formatDate(date)}</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(statuses as Record<string, number>).map(([st, sec]) => (
                        <div key={st} className="flex items-center gap-1.5 text-xs">
                          <div className={`h-2.5 w-2.5 rounded-full ${statusColor[st] || "bg-slate-300"}`} />
                          <span className="font-medium">{st}</span>
                          <span className="text-muted-foreground">{fmtDur(sec)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {statusHistory?.sessions && statusHistory.sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {statusHistory.sessions.map((session: any) => {
                  const login = new Date(session.login);
                  const end = session.logout ? new Date(session.logout) : new Date();
                  const totalSec = Math.round((end.getTime() - login.getTime()) / 1000);
                  const h = Math.floor(totalSec / 3600);
                  const m = Math.floor((totalSec % 3600) / 60);
                  const slices = (session.durations || []).length > 0
                    ? session.durations.map((d: any) => ({
                        status: d.status,
                        startSec: Math.max(0, (new Date(d.startedAt).getTime() - login.getTime()) / 1000),
                        endSec: Math.min(totalSec, (new Date(d.endedAt).getTime() - login.getTime()) / 1000),
                      }))
                    : [{ status: session.status || "Online", startSec: 0, endSec: totalSec }];
                  return (
                    <div key={session.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-center shrink-0">
                            <p className="text-lg font-bold leading-none">{login.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{login.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
                          </div>
                          <div className="text-muted-foreground">→</div>
                          <div className="text-center shrink-0">
                            <p className="text-lg font-bold leading-none">
                              {session.logout ? end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : <span className="text-primary">now</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{session.logout ? end.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "active"}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">{h}h {m}m</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="h-8 rounded-md bg-slate-100 overflow-hidden relative">
                          {slices.map((seg: any, i: number) => {
                            const leftPct = totalSec > 0 ? (seg.startSec / totalSec) * 100 : 0;
                            const widthPct = totalSec > 0 ? ((seg.endSec - seg.startSec) / totalSec) * 100 : 100;
                            return (
                              <div key={i} className={`absolute top-0 h-full ${statusColor[seg.status] || "bg-slate-400"} relative group cursor-default`}
                                style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.3)}%` }}>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                  <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                    {seg.status} · {fmtDur(Math.round(seg.endSec - seg.startSec))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {slices.map((seg: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px]">
                            <div className={`h-2.5 w-2.5 rounded-sm ${statusColor[seg.status] || "bg-slate-300"}`} />
                            <span className="font-medium">{seg.status}</span>
                            <span className="text-muted-foreground">{fmtDur(Math.round(seg.endSec - seg.startSec))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
