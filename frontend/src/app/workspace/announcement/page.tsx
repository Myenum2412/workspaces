import { Megaphone } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function AnnouncementPage() {
  return (
    <ComingSoon
      title="Announcements"
      description="Publish updates, notices, and workspace-wide communication."
      icon={<Megaphone className="size-6 text-muted-foreground" />}
    />
  )
}
