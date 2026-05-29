"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3Icon, CheckCircle2Icon, ListChecksIcon, MegaphoneIcon,
  SettingsIcon, UsersIcon, Building2, SaveIcon, StoreIcon, FolderOpenIcon,
  Smartphone, MessageCircle, QrCode,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarHeader, SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api/config";
import { whatsappService, type WhatsappInstance } from "@/lib/whatsapp/service";

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState({ id: "", name: "User", email: "user@example.com", avatar: "" });
  const [isWorkspaceActive, setIsWorkspaceActive] = React.useState(true);
  const [socket, setSocket] = React.useState<any>(null);

  // Fetch WhatsApp instances for this workspace
  const { data: waInstances = [] } = useQuery({
    queryKey: ["whatsapp-instances-sidebar"],
    queryFn: () => whatsappService.getInstances(),
    refetchInterval: 10000,
  });

  const waInstance = (waInstances[0] || null) as WhatsappInstance | null;
  const isWaConnected = waInstance?.connectionStatus === "connected";

  React.useEffect(() => {
    async function fetchSession() {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const userId = data.user?.$id;
        setUser({
          id: userId || "",
          name: data.user?.name || data.user?.email || "User",
          email: data.user?.email || "user@example.com",
          avatar: "",
        });

        // Initialize Socket
        if (userId) {
          const { io } = await import("socket.io-client");
          const newSocket = io(API_BASE_URL);
          setSocket(newSocket);

          newSocket.on("connect", () => {
            newSocket.emit("identify", userId);
            setIsWorkspaceActive(true);
          });

          newSocket.on("presence_update", ({ userId: uid, online }: any) => {
            if (uid === userId) setIsWorkspaceActive(online);
          });

          const heartbeatInterval = setInterval(() => newSocket.emit("heartbeat"), 15000);
          return () => { clearInterval(heartbeatInterval); newSocket.disconnect(); };
        }
      } catch { /* not authenticated */ }
    }
    fetchSession();

    function handleProfileUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.avatar) {
        const url = detail.avatar.startsWith("http") ? detail.avatar : `${API_BASE_URL}${detail.avatar}`;
        setUser((prev) => ({ ...prev, avatar: url }));
      }
    }
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, []);

  const handleToggleStatus = (checked: boolean) => {
    setIsWorkspaceActive(checked);
    if (socket && user.id) {
      socket.emit("manual_status", { userId: user.id, status: checked ? "Online" : "Offline" });
    }
  };

  const isActiveUrl = (url: string) => {
    if (!pathname) return false;
    return url.split("/").filter(Boolean).length <= 1
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`);
  };

  // Build nav items — add WhatsApp if instance exists
  const navMain = [
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
  ];

  // WhatsApp nav section (only visible when instance exists)
  const whatsappNav = waInstance ? [
    {
      title: "WhatsApp",
      url: "/workspace/whatsapp",
      icon: <Smartphone />,
      badge: isWaConnected ? "Connected" : waInstance.connectionStatus === "connecting" ? "Connecting" : "Disconnected",
      badgeClass: isWaConnected
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : waInstance.connectionStatus === "connecting"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-red-50 text-red-700 border-red-200",
    },
  ] : [];

  return (
    <Sidebar collapsible="icon" className={cn("[&_[data-sidebar=menu-button]]:h-10 [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]_svg]:!size-5", className)} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0">
              <Link href="/workspace">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10 shrink-0">
                  {user.avatar ? (
                    <Image src={user.avatar} alt="" width={32} height={32} className="rounded-lg object-cover size-full" />
                  ) : (
                    <Building2 className="size-5" />
                  )}
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-slate-900 tracking-tighter text-base">{user.name}</span>
                  <span className="truncate text-[9px] font-semibold uppercase text-slate-400 tracking-[0.25em] mt-0.5">My Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Overview" items={navMain} />

        {/* WhatsApp Section */}
        {whatsappNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Communication</SidebarGroupLabel>
            <SidebarMenu>
              {whatsappNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActiveUrl(item.url)}>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <Badge variant="outline" className={cn("absolute right-2 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0 scale-80", item.badgeClass)}>
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Browse apps promo when WhatsApp not installed */}
        {!waInstance && (
          <SidebarGroup>
            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Browse Apps" isActive={isActiveUrl("/workspace/stores")}>
                  <Link href="/workspace/stores">
                    <StoreIcon />
                    <span>Browse Apps</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

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
