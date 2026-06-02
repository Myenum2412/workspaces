"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3Icon, ListChecksIcon, SettingsIcon, UsersIcon, Building2,
  LayoutDashboard, Users,
  ChevronDown, StoreIcon, ShieldCheckIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api/config";
import { profileApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";


// ── Main AppSidebar ─────────────────────────────────────────

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState({ id: "", name: "User", email: "user@example.com", avatar: "" });
  const [isWorkspaceActive, setIsWorkspaceActive] = React.useState(true);
  const [socket, setSocket] = React.useState<any>(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    async function fetchSession() {
      try {
        const hasCookie = document.cookie.includes("access_token=");
        if (!hasCookie) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const userId = data.user?.$id;
        setUser({ id: userId || "", name: data.user?.name || data.user?.email || "User", email: data.user?.email || "user@example.com", avatar: "" });
        if (userId) {
          const { io } = await import("socket.io-client");
          const newSocket = io(API_BASE_URL);
          setSocket(newSocket);
          newSocket.on("connect", () => { newSocket.emit("identify", userId); setIsWorkspaceActive(true); });
          newSocket.on("presence_update", ({ userId: uid, online }: any) => { if (uid === userId) setIsWorkspaceActive(online); });
          const heartbeatInterval = setInterval(() => newSocket.emit("heartbeat"), 15000);
          return () => { clearInterval(heartbeatInterval); newSocket.disconnect(); };
        }
      } catch { /* not authenticated */ }
    }
    fetchSession();
  }, [queryClient]);

  const { data: profileRes } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: profileApi.get,
    staleTime: 30_000,
  });

  const profile = profileRes?.profile;

  const displayAvatar = profile?.avatarUrl || user.avatar;
  const displayName = profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email : user.name;

  const handleToggleStatus = (checked: boolean) => {
    setIsWorkspaceActive(checked);
    if (socket && user.id) socket.emit("manual_status", { userId: user.id, status: checked ? "Online" : "Offline" });
  };

  const isActiveUrl = (url: string) => {
    if (!pathname) return false;
    return url.split("/").filter(Boolean).length <= 1 ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);
  };

  const navMain = [
    { title: "Overview", url: "/workspace", icon: <BarChart3Icon /> },
    { title: "Tasks", url: "/workspace/tasks", icon: <ListChecksIcon />, items: [{ title: "All Tasks", url: "/workspace/tasks" }, { title: "My Tasks", url: "/workspace/my-tasks" }, { title: "Saved Tasks", url: "/workspace/saved-tasks" }] },
    { title: "Staff", url: "/workspace/staffs", icon: <UsersIcon />, items: [{ title: "All Staff", url: "/workspace/staffs" }] },
    { title: "Reports", url: "/workspace/reports", icon: <BarChart3Icon /> },
  ];

  return (
    <Sidebar collapsible="icon" className={cn("[&_[data-sidebar=menu-button]]:h-10 [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]_svg]:!size-5", className)} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0">
              <Link href="/workspace">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10 shrink-0 overflow-hidden">
                  {displayAvatar ? (
                    <img 
                      src={displayAvatar.startsWith("http") ? displayAvatar : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${displayAvatar}`} 
                      alt={displayName || "User"}
                      className="object-cover size-full" 
                    />
                  ) : (
                    <Building2 className="size-5" />
                  )}
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-slate-900 tracking-tighter text-base">{displayName}</span>
                  <span className="truncate text-[9px] font-semibold uppercase text-slate-400 tracking-[0.25em] mt-0.5">My Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Overview" items={navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Apps</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Browse Apps" isActive={isActiveUrl("/workspace/stores")}>
                <Link href="/workspace/stores"><StoreIcon /><span>Browse Apps</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Stores" isActive={isActiveUrl("/workspace/stores")}>
                <Link href="/workspace/stores"><StoreIcon /><span>Stores</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings" isActive={isActiveUrl("/workspace/settings")}>
                <Link href="/workspace/settings"><SettingsIcon /><span>Settings</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
