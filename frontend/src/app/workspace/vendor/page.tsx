import { Truck } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function VendorPage() {
  return (
    <ComingSoon
      title="Vendor Management"
      description="Maintain vendor details, services, and related tasks."
      icon={<Truck className="size-6 text-muted-foreground" />}
    />
  )
}
