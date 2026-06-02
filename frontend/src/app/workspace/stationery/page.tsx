import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react"

export default function StationeryPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Stationery Management
          </CardTitle>
          <CardDescription>
            Manage stationery inventory, requests, and usage.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">48</div>
                <p className="text-xs text-muted-foreground mt-1">In inventory</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Pending Requests</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">5</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">3</div>
                <p className="text-xs text-muted-foreground mt-1">Items need reorder</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Monthly Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">+12%</div>
                <p className="text-xs text-muted-foreground mt-1">From last month</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-dashed bg-muted/50">
            <CardContent className="text-sm text-muted-foreground py-20 flex items-center justify-center italic">
              Stationery management interface is coming soon.
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
