import { Wrench } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function AssetsMaintenancePage() {
  return (
    <ComingSoon
      title="Assets Maintenance"
      description="Monitor asset maintenance schedules, status, and service work."
      icon={<Wrench className="size-6 text-muted-foreground" />}
    />
  )
}
