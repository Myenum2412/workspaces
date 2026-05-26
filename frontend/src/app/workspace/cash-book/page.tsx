"use client"

import { Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { CashBookTablePage } from "./cash-book-table-page"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react"

export default function CashBookPage() {
  return (
    <section className="space-y-6">
      <Card className=" border bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Cash Book
          </CardTitle>
          <CardDescription>
            Track cash transactions, vouchers, and financial records.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Cash Book
                </CardTitle>
                <DollarSign className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">Active</div>
                <p className="text-xs text-slate-700 mt-1">Recording transactions</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Total Receipts
                </CardTitle>
                <Receipt className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">24</div>
                <p className="text-xs text-slate-700 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Cash In Hand
                </CardTitle>
                <Wallet className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">$5.2K</div>
                <p className="text-xs text-slate-700 mt-1">Available balance</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-100 bg-card ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                  Pending Verification
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-950">3</div>
                <p className="text-xs text-slate-700 mt-1">Awaiting review</p>
              </CardContent>
            </Card>
          </div>

          {/* Cash Book Table */}
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <CashBookTablePage />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  )
}
