import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone, Bell, Calendar, Users } from "lucide-react"

export default function AnnouncementPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Announcements
          </CardTitle>
          <CardDescription>
            Publish updates, notices, and workspace-wide communication.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Announcements
                </CardTitle>
                <Megaphone className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">24</div>
                <p className="text-xs text-slate-700 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Active Notices
                </CardTitle>
                <Bell className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">5</div>
                <p className="text-xs text-slate-700 mt-1">Currently visible</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Scheduled
                </CardTitle>
                <Calendar className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">3</div>
                <p className="text-xs text-slate-700 mt-1">Upcoming posts</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Reach
                </CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">100%</div>
                <p className="text-xs text-slate-700 mt-1">Workspace coverage</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Content */}
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
              Announcement management interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
