"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3Icon, CheckCircle2Icon, ListChecksIcon, MegaphoneIcon,
  SettingsIcon, UsersIcon, Building2, Command, SaveIcon, StoreIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { usePathname } from "next/navigation"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/lib/api/config"

const data = {
  navMain: [
    { title: "Overview", url: "/workspace", icon: <BarChart3Icon /> },
    { title: "Tasks", url: "/workspace/tasks", icon: <ListChecksIcon />, items: [
      { title: "All Tasks", url: "/workspace/tasks", icon: <ListChecksIcon /> },
      { title: "Saved Tasks", url: "/workspace/saved-tasks", icon: <SaveIcon /> },
    ]},
    { title: "My Tasks", url: "/workspace/my-tasks", icon: <CheckCircle2Icon /> },
    { title: "Staff", url: "/workspace/staffs", icon: <UsersIcon />, items: [
      { title: "All Staff", url: "/workspace/staffs", icon: <UsersIcon /> },
    ]},
    { title: "Reports", url: "/workspace/reports", icon: <BarChart3Icon /> },
  ],
  financeNav: [
    { title: "Stores", url: "/workspace/stores", icon: <StoreIcon /> },
  ],
  bottomNav: [
    { title: "Operations", url: "/workspace/operations", icon: <Command /> },
    { title: "Announcements", url: "/workspace/announcement", icon: <MegaphoneIcon /> },
    { title: "Settings", url: "/workspace/settings", icon: <SettingsIcon /> },
  ],
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = React.useState("Workspace")
  const [user, setUser] = React.useState({ name: "User", email: "user@example.com", avatar: "" })

  React.useEffect(() => {
    async function fetchSession() {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) return
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setUser({
          name: data.user?.name || data.user?.email || "User",
          email: data.user?.email || "user@example.com",
          avatar: "",
        })
        // Fetch org for avatar
        const orgId = data.user?.organizationId || data.organization?.$id
        if (orgId) {
          try {
            const { databases, DB_ID, COLLECTIONS } = await import("@/lib/appwrite/client")
            const org = await databases.getDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId) as any
            if (org?.logoUrl) {
              setUser((prev) => ({ ...prev, avatar: `${API_BASE_URL}${org.logoUrl}` }))
            }
          } catch { /* no org avatar */ }
        }
      } catch {
        // not authenticated, keep defaults
      }
    }
    fetchSession()

    // Listen for profile updates (avatar upload)
    function handleProfileUpdated(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.avatar) {
        const url = detail.avatar.startsWith("http") ? detail.avatar : `${API_BASE_URL}${detail.avatar}`
        setUser((prev) => ({ ...prev, avatar: url }))
      }
    }
    window.addEventListener("profile-updated", handleProfileUpdated)
    return () => window.removeEventListener("profile-updated", handleProfileUpdated)
  }, [])

  const isActiveUrl = (url: string) =>
    url.split("/").filter(Boolean).length <= 1
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`)

  return (
    <Sidebar collapsible="icon" className={cn("[&_[data-sidebar=menu-button]]:h-10 [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]_svg]:!size-5", className)} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0">
              <Link href="/workspace">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10">
                  <Building2 className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-slate-900 tracking-tighter text-base">{companyName}</span>
                  <span className="truncate text-[9px] font-semibold uppercase text-slate-400 tracking-[0.25em] mt-0.5">Workspace Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Overview" items={data.navMain} />
        <NavMain label="Marketplace" items={data.financeNav} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {data.bottomNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActiveUrl(item.url)}>
                  <Link href={item.url}>{item.icon}<span>{item.title}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
