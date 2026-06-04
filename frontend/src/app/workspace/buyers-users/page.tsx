"use client"

import * as React from "react"
import { Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BuyersUsersPage() {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Buyers & Users
          </CardTitle>
          <CardDescription>
            Manage buyer accounts and user access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <Building2 className="size-8" />
              <span className="text-sm font-medium">Under development</span>
              <span className="text-xs">Buyer and user management will be available in an upcoming release.</span>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
