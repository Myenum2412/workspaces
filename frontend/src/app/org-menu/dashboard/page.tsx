"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserPlus, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgAuth } from "../layout";
import { api } from "@/lib/api/client";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  organizationName: string;
}

interface RecentMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

export default function DashboardPage() {
  const { session } = useOrgAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    organizationName: session?.organization?.name ?? "Organization Portal",
  });
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.organization?.id) { setLoading(false); return; }

      try {
        const orgId = session.organization.id;

        // Fetch members
        const membersRes = await api.get<{ success: boolean; members: any[] }>(
          `/api/members?organizationId=${orgId}`
        );
        const members = membersRes.members ?? [];
        const activeCount = members.filter((m: any) => m.status === "active").length;

        // Fetch pending invites
        const invitesRes = await api.get<{ success: boolean; invitations: any[] }>(
          `/api/invitations?organizationId=${orgId}`
        );
        const pendingInvites = (invitesRes.invitations ?? []).filter((i: any) => i.status === "pending").length;

        // Fetch recent profiles
        const profilesRes = await api.get<{ success: boolean; data: any[] }>(
          `/api/staff?organizationId=${orgId}&limit=5&sort=createdAt:desc`
        );
        const recent: RecentMember[] = (profilesRes.data ?? []).map((doc: any) => ({
          id: doc._id ?? doc.id ?? "",
          firstName: doc.firstName ?? "",
          lastName: doc.lastName ?? "",
          email: doc.email ?? "",
          role: doc.role ?? "",
          status: doc.status ?? "",
          joinedAt: doc.joinedAt ?? doc.createdAt ?? "",
        }));

        setStats({
          totalMembers: members.length,
          activeMembers: activeCount,
          pendingInvites,
          organizationName: session.organization?.name ?? "Organization Portal",
        });
        setRecentMembers(recent);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.organization?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Members</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.totalMembers}</div>
            <p className="text-xs text-slate-500 mt-1">In your organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.activeMembers}</div>
            <p className="text-xs text-slate-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats.pendingInvites}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.organizationName}</div>
            <p className="text-xs text-slate-500 mt-1">Your company</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Members</CardTitle>
          <CardDescription>Latest members who joined your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400"><p className="text-sm">Loading...</p></div>
          ) : recentMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No members yet. Invite your team to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                      {(member.firstName?.[0] ?? "?")}{(member.lastName?.[0] ?? "")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 capitalize">
                      {member.role}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
