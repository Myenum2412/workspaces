"use client"

import * as React from "react"
import Link from "next/link"
import {
  BarChart3Icon, CheckCircle2Icon, ListChecksIcon, MegaphoneIcon,
  SettingsIcon, UsersIcon, Building2, SaveIcon, StoreIcon, FolderOpenIcon,
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
      { title: "My Tasks", url: "/workspace/my-tasks", icon: <CheckCircle2Icon /> },
      { title: "Saved Tasks", url: "/workspace/saved-tasks", icon: <SaveIcon /> },
    ]},
    { title: "Staff", url: "/workspace/staffs", icon: <UsersIcon />, items: [
      { title: "All Staff", url: "/workspace/staffs", icon: <UsersIcon /> },
    ]},
    { title: "Reports", url: "/workspace/reports", icon: <BarChart3Icon /> },
  ],
  financeNav: [
    { title: "Stores", url: "/workspace/stores", icon: <StoreIcon /> },
  ],
  bottomNav: [
    { title: "Office Files", url: "/workspace/office-files", icon: <FolderOpenIcon /> },
    { title: "Announcements", url: "/workspace/announcement", icon: <MegaphoneIcon /> },
    { title: "Settings", url: "/workspace/settings", icon: <SettingsIcon /> },
  ],
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = React.useState("Workspace")
  const [user, setUser] = React.useState({ id: "", name: "User", email: "user@example.com", avatar: "" })
  const [isWorkspaceActive, setIsWorkspaceActive] = React.useState(true)
  const [socket, setSocket] = React.useState<any>(null)

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
        const userId = data.user?.$id
        setUser({
          id: userId || "",
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

        // Initialize Socket
        if (userId) {
          const { io } = await import("socket.io-client")
          const newSocket = io(API_BASE_URL)
          setSocket(newSocket)

          newSocket.on("connect", () => {
            newSocket.emit("identify", userId)
            setIsWorkspaceActive(true)
          })

          newSocket.on("presence_update", ({ userId: uid, online }: any) => {
            if (uid === userId) {
              setIsWorkspaceActive(online)
            }
          })

          // Heartbeat
          const heartbeatInterval = setInterval(() => {
            newSocket.emit("heartbeat")
          }, 15000)

          return () => {
            clearInterval(heartbeatInterval)
            newSocket.disconnect()
          }
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

  const handleToggleStatus = (checked: boolean) => {
    setIsWorkspaceActive(checked)
    if (socket && user.id) {
      socket.emit("manual_status", { userId: user.id, status: checked ? "Online" : "Offline" })
    }
  }

  const isActiveUrl = (url: string) => {
    if (!pathname) return false
    return url.split("/").filter(Boolean).length <= 1
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar collapsible="icon" className={cn("[&_[data-sidebar=menu-button]]:h-10 [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]_svg]:!size-5", className)} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0">
              <Link href="/workspace">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10 shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-slate-900 tracking-tighter text-base">{companyName}</span>
                  <span className="truncate text-[9px] font-semibold uppercase text-slate-400 tracking-[0.25em] mt-0.5">Workspace Portal</span>
                </div>
                <label 
                  className="relative inline-flex items-center gap-2 text-gray-900 scale-75 origin-right cursor-pointer group-data-[collapsible=icon]:hidden shrink-0 ml-auto mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={isWorkspaceActive} 
                    onChange={(e) => handleToggleStatus(e.target.checked)} 
                  />
                  <div className="peer h-5 w-9 rounded-full bg-slate-300 ring-offset-1 transition-colors duration-200 peer-checked:bg-emerald-500"></div>
                  <span className="dot absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isWorkspaceActive ? "text-emerald-600" : "text-slate-400")}>
                    {isWorkspaceActive ? "Active" : "Inactive"}
                  </span>
                </label>
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
