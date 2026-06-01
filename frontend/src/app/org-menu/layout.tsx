"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, authApi } from "@/lib/api/client";
import { OrgSidebar } from "./org-sidebar";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthSession, Organization, OrgMember, UserProfile } from "@/types";

// ── Auth Context ──────────────────────────────────────────────

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useOrgAuth() {
  return useContext(AuthContext);
}

// ── Layout ────────────────────────────────────────────────────

export default function OrgMenuLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const isAuthPage = pathname === "/org-menu/register";

  const refresh = async () => {
    try {
      const result = await api.get<{ success: boolean; user: any; organization: any; membership: any }>("/api/auth/me");

      const user = result.user;
      const org = result.organization as Organization | null;
      const membership = result.membership as { role: string; organizationId: string } | null;

      setSession({
        user: {
          id: user.$id ?? user.id ?? "",
          email: user.email ?? "",
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          name: user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified ?? false,
          role: membership?.role ?? user.role,
          organizationId: membership?.organizationId ?? user.organizationId,
        },
        organization: org ? { ...org, id: org._id ?? org.id } : null,
        membership,
      });
    } catch {
      setSession(null);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }

    setSession(null);
    toast.success("Signed out");
    router.push("/login");
  };

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    refresh().finally(() => {
      setLoading(false);
      setInitialized(true);
    });
  }, [pathname, isAuthPage]);

  useEffect(() => {
    if (initialized && !loading && !session && !isAuthPage) {
      router.replace("/login");
    }
  }, [initialized, loading, session, isAuthPage, router]);

  // Only admin email can access org-menu
  useEffect(() => {
    if (session) {
      const email = session.user.email?.toLowerCase();
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
      if (!adminEmail || email !== adminEmail) {
        router.replace("/workspace");
      }
    }
  }, [session, router]);

  if (isAuthPage) return <>{children}</>;

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading, refresh, logout }}>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-zinc-50">
          <OrgSidebar />
          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-2 mr-2" />
                <h1 className="text-lg font-semibold text-slate-900">
                  {session.organization?.name ?? "Organization Portal"}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">
                    {session.user.firstName} {session.user.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(session.user.firstName?.[0] ?? "?")}
                  {(session.user.lastName?.[0] ?? "")}
                </div>
                <Button variant="ghost" size="sm" onClick={logout} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthContext.Provider>
  );
}
