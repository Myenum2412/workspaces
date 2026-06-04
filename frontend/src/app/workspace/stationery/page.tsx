import { BookOpen } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function StationeryPage() {
  return (
    <ComingSoon
      title="Stationery"
      description="Manage stationery inventory, requests, and supplies."
      icon={<BookOpen className="size-6 text-muted-foreground" />}
    />
  )
}
