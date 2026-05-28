import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Calendar, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Reports
          </CardTitle>
          <CardDescription>
            View operational reports and workspace summaries.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">32</div>
                <p className="text-xs text-slate-700 mt-1">Generated reports</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  This Month
                </CardTitle>
                <Calendar className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">8</div>
                <p className="text-xs text-slate-700 mt-1">New reports</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Growth
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">+15%</div>
                <p className="text-xs text-slate-700 mt-1">vs last month</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Exports
                </CardTitle>
                <Download className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">24</div>
                <p className="text-xs text-slate-700 mt-1">Downloaded</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Content */}
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
              Reports interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
