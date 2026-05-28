import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Package, DollarSign, Star } from "lucide-react"

export default function VendorPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Vendor Management
          </CardTitle>
          <CardDescription>
            Maintain vendor details, services, and related tasks.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Vendors
                </CardTitle>
                <Truck className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">15</div>
                <p className="text-xs text-slate-700 mt-1">Registered vendors</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Active Orders
                </CardTitle>
                <Package className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">7</div>
                <p className="text-xs text-slate-700 mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Monthly Spend
                </CardTitle>
                <DollarSign className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">$12.5K</div>
                <p className="text-xs text-slate-700 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Avg Rating
                </CardTitle>
                <Star className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">4.5</div>
                <p className="text-xs text-slate-700 mt-1">Out of 5.0</p>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder Content */}
          <Card className="border-dashed bg-slate-50/50">
            <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
              Vendor management interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
