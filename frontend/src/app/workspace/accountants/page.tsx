import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Calculator, Briefcase } from "lucide-react"

export default function AccountantsPage() {
  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Accountants
          </CardTitle>
          <CardDescription>
            Coordinate accountant records, assignments, and reporting.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Accountants
                </CardTitle>
                <Users className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">8</div>
                <p className="text-xs text-slate-700 mt-1">Certified professionals</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Active Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">12</div>
                <p className="text-xs text-slate-700 mt-1">This quarter</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Pending Reviews
                </CardTitle>
                <Calculator className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">3</div>
                <p className="text-xs text-slate-700 mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Assignments
                </CardTitle>
                <Briefcase className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">24</div>
                <p className="text-xs text-slate-700 mt-1">Active tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Content */}
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
              Accountant management interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
