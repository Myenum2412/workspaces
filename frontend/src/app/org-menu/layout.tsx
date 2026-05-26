"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AuthSession } from "@/lib/appwrite/types";
import { account, databases, Query, COLLECTIONS, DB_ID } from "@/lib/appwrite/client";
import { OrgSidebar } from "./org-sidebar";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

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

function mapUser(u: any): AuthSession["user"] {
  return {
    $id: u.$id,
    $createdAt: u.$createdAt ?? "",
    $updatedAt: u.$updatedAt ?? "",
    name: u.name,
    email: u.email,
    emailVerification: u.emailVerification ?? false,
    phone: u.phone ?? "",
    phoneVerification: u.phoneVerification ?? false,
    status: u.status ?? true,
    prefs: u.prefs ?? {},
    registration: u.registration ?? "",
    labels: u.labels ?? [],
    accessedAt: u.accessedAt ?? "",
  } as AuthSession["user"];
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
    // 1. Verify Appwrite session
    const user = await account.get();

    // 2. Try to fetch profile from DB using actual user ID (non-fatal)
    let profile: AuthSession["profile"] = null;
    try {
      const profileList = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.USER_PROFILES,
        [Query.equal("userId", user.$id), Query.limit(1)]
      );
      profile = (profileList.documents[0] as unknown as AuthSession["profile"]) ?? null;
    } catch {
      // Collection may not exist — that's OK
    }

    // 3. Try to fetch org membership (non-fatal)
    let membership: AuthSession["membership"] = null;
    let organization: AuthSession["organization"] = null;

    const orgId = profile?.organizationId;
    if (orgId) {
      try {
        const memberList = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.ORG_MEMBERS,
          [
            Query.equal("userId", user.$id),
            Query.equal("organizationId", orgId),
            Query.limit(1),
          ]
        );
        membership = (memberList.documents[0] as unknown as AuthSession["membership"]) ?? null;

        const orgDoc = await databases.getDocument(DB_ID, COLLECTIONS.ORGANIZATIONS, orgId);
        organization = orgDoc as unknown as AuthSession["organization"];
      } catch {
        // Collections may not exist — that's OK
      }
    }

    setSession({
      user: mapUser(user),
      profile,
      organization,
      membership,
    });
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch {
      // ignore
    }

    setSession(null);
    toast.success("Signed out");
    router.push("/login");
  };

  // Fetch session on mount (skip on auth pages)
  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      setInitialized(true);
      return;
    }
    refresh()
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, [pathname, isAuthPage]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !loading && !session && !isAuthPage) {
      router.replace("/login");
    }
  }, [initialized, loading, session, isAuthPage, router]);

  // Only developer@myenum.in can access org-menu as owner; all others redirected
  useEffect(() => {
    if (session) {
      const email = session.user.email?.toLowerCase();
      if (email !== "developer@myenum.in") {
        router.replace("/workspace");
      }
    }
  }, [session, router]);

  // Auth pages render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Not authenticated — show spinner while redirect effect runs
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Authenticated — render full layout
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
                    {session.profile?.firstName ?? session.user.name}{" "}
                    {session.profile?.lastName ?? ""}
                  </p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                  {(session.profile?.firstName?.[0] ?? session.user.name?.[0] ?? "?")}
                  {(session.profile?.lastName?.[0] ?? "")}
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
