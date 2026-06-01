"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ClipboardCheck, Clock, UserIcon } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function StaffDashboardPage() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile)
        }
      } catch (err) {
        console.error("Failed to fetch profile", err)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="flex-1 space-y-6 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
      </div>

      {profile && (
        <Card className="bg-white border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-emerald-50">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary/10 text-emerald-900 font-bold">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none uppercase tracking-widest text-[10px]">
                    {profile.status || "Active"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-4 w-4" />
                    {profile.designation || "Staff Member"}
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">EMP ID:</span> {profile.empId || "N/A"}
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">Dept:</span> {profile.department || "General"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active tasks requiring your attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <p className="text-xs text-muted-foreground mt-1">
              Status updated just now
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Present</div>
            <p className="text-xs text-muted-foreground mt-1">
              Logged in successfully today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
