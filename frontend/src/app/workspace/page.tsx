import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, TrendingUp, Activity, Users } from "lucide-react";
import { TaskTablePage } from "./task-table-page";
import { getTaskStats } from "@/lib/server/tasks";

async function TaskStatsCards() {
  const stats = await getTaskStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-primary/20 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Overview</CardTitle>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">Active</div>
          <div className="flex items-center gap-1 text-xs text-foreground">
            <Activity className="h-3 w-3" />
            <span className="font-medium">System Status</span>
            <span className="text-muted-foreground">Optimal</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Total Tasks</CardTitle>
          <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {stats.todayTask + stats.inProgressTask + stats.pendingTask + stats.postponedTask + stats.repeatedTask + stats.overdueTask}
          </div>
          <div className="flex items-center gap-1 text-xs text-foreground">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{stats.todayTask} due today</span>
            <span className="text-muted-foreground">this period</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Pending Tasks</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.pendingTask}</div>
          <div className="flex items-center gap-1 text-xs text-foreground">
            <Activity className="h-3 w-3" />
            <span className="font-medium">In Progress</span>
            <span className="text-muted-foreground">awaiting action</span>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/20 bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Overdue</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{stats.overdueTask}</div>
          <div className="flex items-center gap-1 text-xs text-foreground">
            <Activity className="h-3 w-3" />
            <span className="font-medium">Urgent</span>
            <span className="text-muted-foreground">requires attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyTaskPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            My Tasks Overview
          </CardTitle>
          <CardDescription>
            Overview for the My Task workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          }>
            <TaskStatsCards />
          </Suspense>

          <div className="pt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <TaskTablePage />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
