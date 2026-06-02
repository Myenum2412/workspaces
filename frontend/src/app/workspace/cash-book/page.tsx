import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react";
import { CashBookTablePage } from "./cash-book-table-page";

export default function CashBookPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Cash Book
          </CardTitle>
          <CardDescription>
            Track cash transactions, vouchers, and financial records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Cash Book</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">Active</div>
                <p className="text-xs text-foreground mt-1">Recording transactions</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Receipts</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">24</div>
                <p className="text-xs text-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Cash In Hand</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">$5.2K</div>
                <p className="text-xs text-foreground mt-1">Available balance</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Pending Verification</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">3</div>
                <p className="text-xs text-foreground mt-1">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CashBookTablePage />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  );
}
