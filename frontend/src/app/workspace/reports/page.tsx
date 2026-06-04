import { FileText } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="View operational reports and workspace summaries."
      icon={<FileText className="size-6 text-muted-foreground" />}
    />
  )
}
