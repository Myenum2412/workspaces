import { Settings } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function OperationsPage() {
  return (
    <ComingSoon
      title="Operations"
      description="Manage operational tasks, controls, and daily execution."
      icon={<Settings className="size-6 text-muted-foreground" />}
    />
  )
}
