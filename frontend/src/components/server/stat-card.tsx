import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className = "border-primary/20 bg-card",
  titleClassName = "text-slate-700",
  valueClassName = "text-primary",
  iconClassName = "text-slate-600",
}: StatCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${titleClassName}`}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
        <p className={`text-xs mt-1 ${titleClassName}`}>{description}</p>
      </CardContent>
    </Card>
  );
}

interface StatCardsGridProps {
  cards: StatCardProps[];
  columns?: string;
}

export function StatCardsGrid({ cards, columns = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" }: StatCardsGridProps) {
  return (
    <div className={columns}>
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
