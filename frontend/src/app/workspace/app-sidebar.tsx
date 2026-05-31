"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3Icon, ListChecksIcon, SettingsIcon, UsersIcon, Building2,
  MessageCircle, QrCode, Send, Megaphone, LayoutDashboard, UserCircle,
  FileText, Zap, BarChart2, Smartphone, ClipboardList, Bot, History,
  ChevronDown, StoreIcon, ShieldCheckIcon, Bell, Tag, Inbox, Users,
  UserPlus, Download, Upload, Activity, Globe, Clock, Webhook,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarRail,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api/config";
import { whatsappService, type WhatsappInstance } from "@/lib/whatsapp/service";
import { profileApi, workspaceApi } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";

// ── WhatsApp submenu items ──────────────────────────────────

interface WhatsAppSubItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

interface WhatsAppMenuGroup {
  title: string;
  items: WhatsAppSubItem[];
}

const whatsappGroups: WhatsAppMenuGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/workspace/whatsapp", icon: LayoutDashboard, description: "Overview & status" },
      { title: "QR Scanner", url: "/workspace/whatsapp/qr", icon: QrCode, description: "Scan QR to connect" },
    ],
  },
  {
    title: "Messaging",
    items: [
      { title: "Chats", url: "/workspace/whatsapp/chats", icon: MessageCircle, description: "Conversation list" },
      { title: "Send Message", url: "/workspace/whatsapp/send", icon: Send, description: "Send single message" },
      { title: "Bulk Messaging", url: "/workspace/whatsapp/bulk", icon: Megaphone, description: "Send bulk messages" },
      { title: "Message History", url: "/workspace/whatsapp/history", icon: History, description: "Message logs" },
    ],
  },
  {
    title: "Contacts & Groups",
    items: [
      { title: "Contacts", url: "/workspace/whatsapp/contacts", icon: UserCircle, description: "Manage contacts" },
      { title: "Import Contacts", url: "/workspace/whatsapp/contacts/import", icon: Upload, description: "Import from CSV" },
      { title: "Export Contacts", url: "/workspace/whatsapp/contacts/export", icon: Download, description: "Export contacts" },
      { title: "Groups", url: "/workspace/whatsapp/groups", icon: Users, description: "Group management" },
      { title: "Labels", url: "/workspace/whatsapp/labels", icon: Tag, description: "Organize with labels" },
    ],
  },
  {
    title: "Campaigns & Templates",
    items: [
      { title: "Templates", url: "/workspace/whatsapp/templates", icon: FileText, description: "Message templates" },
      { title: "Campaigns", url: "/workspace/whatsapp/campaigns", icon: Megaphone, description: "Marketing campaigns" },
      { title: "Scheduled Messages", url: "/workspace/whatsapp/scheduled", icon: Clock, description: "Scheduled sends" },
    ],
  },
  {
    title: "Automation",
    items: [
      { title: "Auto Reply", url: "/workspace/whatsapp/automation", icon: Bot, description: "Auto-reply rules" },
      { title: "Webhooks", url: "/workspace/whatsapp/webhooks", icon: Webhook, description: "Webhook config" },
      { title: "Chatbot", url: "/workspace/whatsapp/chatbot", icon: Bot, description: "AI chatbot" },
    ],
  },
  {
    title: "Analytics & Reports",
    items: [
      { title: "Reports", url: "/workspace/whatsapp/reports", icon: BarChart2, description: "Message analytics" },
      { title: "Activity Logs", url: "/workspace/whatsapp/logs", icon: Activity, description: "Audit trail" },
      { title: "Performance", url: "/workspace/whatsapp/performance", icon: BarChart3Icon, description: "Performance metrics" },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Sessions", url: "/workspace/whatsapp/sessions", icon: Smartphone, description: "Manage sessions" },
      { title: "Notifications", url: "/workspace/whatsapp/notifications", icon: Bell, description: "Notification center" },
      { title: "Settings", url: "/workspace/whatsapp/settings", icon: SettingsIcon, description: "WhatsApp config" },
    ],
  },
];

const allWhatsAppUrls = whatsappGroups.flatMap((g) => g.items.map((i) => i.url));
const APP_SIDEBAR_LABEL = "My Store";

// ── WhatsApp Collapsible ─────────────────────────────────────

function WhatsAppCollapsible({ waInstance, isWaConnected, pathname }: { waInstance: WhatsappInstance | null; isWaConnected: boolean; pathname: string }) {
  const isWhatsAppActive = pathname.startsWith("/workspace/whatsapp");

  return (
    <Collapsible defaultOpen={isWhatsAppActive} className="group/collapsible whatsapp-section">
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2" suppressHydrationWarning>
          <WhatsappIcon size={16} color="currentColor" />
          <span>{APP_SIDEBAR_LABEL}</span>
        </SidebarGroupLabel>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn("w-full justify-between", isWhatsAppActive && "bg-sidebar-accent text-sidebar-accent-foreground")}
              tooltip={APP_SIDEBAR_LABEL}
            >
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <WhatsappIcon size={16} color="currentColor" />
                <span>{APP_SIDEBAR_LABEL}</span>
                {waInstance && (
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", isWaConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}>
                    {isWaConnected ? "Online" : "Offline"}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="ml-2 border-l border-sidebar-border pl-2">
              {whatsappGroups.map((group) => (
                <React.Fragment key={group.title}>
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</span>
                  </div>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = item.url === "/workspace/whatsapp"
                      ? pathname === "/workspace/whatsapp" || pathname === "/workspace/whatsapp/"
                      : pathname.startsWith(item.url);
                    return (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton asChild isActive={isActive}>
                          <Link href={item.url}>
                            <ItemIcon className="h-3.5 w-3.5" />
                            <span className="text-xs">{item.title}</span>
                            {item.badge && <Badge variant="secondary" className="ml-auto text-[9px] h-4">{item.badge}</Badge>}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </React.Fragment>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </SidebarGroup>
    </Collapsible>
  );
}

// ── Main AppSidebar ─────────────────────────────────────────

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [user, setUser] = React.useState({ id: "", name: "User", email: "user@example.com", avatar: "" });
  const [isWorkspaceActive, setIsWorkspaceActive] = React.useState(true);
  const [socket, setSocket] = React.useState<any>(null);

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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
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
  }, []);

  const { data: profileRes } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: profileApi.get,
    staleTime: 30_000,
  });

  const { data: themeRes } = useQuery({
    queryKey: ["theme-settings"],
    queryFn: workspaceApi.getThemeSettings,
    staleTime: 60_000,
  });

  const profile = profileRes?.profile;
  const themeSettings = themeRes?.themeSettings || {};
  
  // Use branding if available, fallback to user info
  const displayAvatar = themeSettings.companyLogo || profile?.avatarUrl || user.avatar;
  const displayName = themeSettings.companyName || (profile ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email : user.name);

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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10 shrink-0 overflow-hidden">
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
        <WhatsAppCollapsible waInstance={waInstance} isWaConnected={isWaConnected} pathname={pathname} />
        {!waInstance && (
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
