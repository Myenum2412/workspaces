import { BookOpenText } from "lucide-react"
import { ComingSoon } from "@/components/shared/coming-soon"

export default function CashBookPage() {
  return (
    <ComingSoon
      title="Cash Book"
      description="Track cash transactions, balances, and financial records."
      icon={<BookOpenText className="size-6 text-muted-foreground" />}
    />
  )
}
