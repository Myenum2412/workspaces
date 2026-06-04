"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddEmployeeDialog } from "./add-employee-dialog"
import { EmployeeTablePage } from "./employee-table-page"
import { Users, UserCheck, UserX, Briefcase } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { employeeService } from "@/lib/services/employee-service"

export default function EmployeesPage() {
  const { data: stats = { totalEmployees: 0, activeNow: 0, onLeave: 0, assignedTasks: 0 } } = useQuery({
    queryKey: ["employee-stats"],
    queryFn: () => employeeService.getEmployeeStats(),
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["employee-stats"] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  return (
    <section className="space-y-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Employee Management
              </CardTitle>
              <CardDescription>
                Manage employee records, responsibilities, and availability.
              </CardDescription>
            </div>
            <AddEmployeeDialog />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Total Employee
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
                <p className="text-xs text-foreground mt-1">All registered members</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Active Now
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.activeNow}</div>
                <p className="text-xs text-foreground mt-1">Currently working</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  On Leave
                </CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.onLeave}</div>
                <p className="text-xs text-foreground mt-1">Away today</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-primary/20 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Assigned Tasks
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.assignedTasks}</div>
                <p className="text-xs text-foreground mt-1">Across all employees</p>
              </CardContent>
            </Card>
          </div>

          {/* Employee Table */}
          <EmployeeTablePage />
        </CardContent>
    </section>
  )
}
