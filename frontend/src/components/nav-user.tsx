"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDownIcon, SparklesIcon, BadgeCheckIcon, CreditCardIcon, BellIcon, LogOutIcon, Building2 } from "lucide-react";
import { authApi, profileApi } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";

export function NavUser({
  user: propUser,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Self-fetch profile for live sync
  const { data: profileRes } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: profileApi.get,
    staleTime: 30_000,
  });

  const profile = profileRes?.profile;

  // Use profile data if available, else fallback to props
  const displayName = profile
    ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email
    : propUser.name;
  const displayEmail = profile?.email ?? propUser.email;
  const displayAvatar = profile?.avatarUrl ?? propUser.avatar;

  // Listen for global avatar update events from profile page
  useEffect(() => {
    const handler = () => setAvatarVersion((v) => v + 1);
    window.addEventListener("avatar_updated_global", handler);
    return () => window.removeEventListener("avatar_updated_global", handler);
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700">
                {displayAvatar && (
                  <AvatarImage
                    src={displayAvatar.startsWith("http") ? displayAvatar : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${displayAvatar}`}
                    alt={displayName}
                    key={avatarVersion}
                  />
                )}
                <AvatarFallback className="rounded-lg bg-emerald-100">
                  <Building2 className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700">
                  {displayAvatar && (
                    <AvatarImage
                      src={displayAvatar.startsWith("http") ? displayAvatar : `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}${displayAvatar}`}
                      alt={displayName}
                    />
                  )}
                  <AvatarFallback className="rounded-lg bg-emerald-100">
                    <Building2 className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => router.push("/workspace/profile")}>
                <BadgeCheckIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
