"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  UsersIcon,
  SettingsIcon,
  Building2,
  Mail,
  ShieldCheckIcon,
  Crown,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useOrgAuth } from "./layout";
import { cn } from "@/lib/utils";

const data = {
  navMain: [
    { title: "Dashboard", url: "/org-menu/dashboard", icon: <BarChart3Icon /> },
    { title: "CEO", url: "/org-menu/ceo", icon: <Crown /> },
    { title: "Users", url: "/org-menu/users", icon: <UsersIcon />, items: [
      { title: "All Users", url: "/org-menu/users", icon: <UsersIcon /> },
    ]},
    { title: "Invitations", url: "/org-menu/invitations", icon: <Mail /> },
  ],
  bottomNav: [
    { title: "Settings", url: "/org-menu/settings", icon: <SettingsIcon /> },
  ],
};

export function OrgSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { session } = useOrgAuth();
  const orgName = session?.organization?.name ?? "Organization";
  const userName = session?.profile
    ? `${session.profile.firstName ?? ""} ${session.profile.lastName ?? ""}`.trim()
    : session?.user.name ?? "User";
  const email = session?.user.email ?? "user@example.com";

  const isActiveUrl = (url: string) => {
    if (url.split("/").filter(Boolean).length <= 1) return pathname === url;
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn("[&_[data-sidebar=menu-button]]:h-10 [&_[data-sidebar=menu-button]]:gap-3 [&_[data-sidebar=menu-button]_svg]:!size-5", className)}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0">
              <Link href="/org-menu/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10">
                  <Building2 className="size-5" />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-slate-900 tracking-tighter text-base">{orgName}</span>
                  <span className="truncate text-[9px] font-semibold uppercase text-slate-400 tracking-[0.25em] mt-0.5">Organization Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Management" items={data.navMain} />
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
        <NavUser user={{ name: userName, email, avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
