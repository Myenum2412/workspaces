import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, AlertTriangle, Calendar, CheckCircle } from "lucide-react"

export default function AssetsMaintenancePage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Assets Maintenance
          </CardTitle>
          <CardDescription>
            Monitor asset maintenance schedules, status, and service work.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Assets
                </CardTitle>
                <Wrench className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">45</div>
                <p className="text-xs text-slate-700 mt-1">Registered assets</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Maintenance Required
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">6</div>
                <p className="text-xs text-slate-700 mt-1">Needs attention</p>
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
                <div className="text-2xl font-bold text-primary">12</div>
                <p className="text-xs text-slate-700 mt-1">Upcoming tasks</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">89</div>
                <p className="text-xs text-slate-700 mt-1">This quarter</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Content */}
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
              Assets maintenance interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
