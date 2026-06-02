import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SectionPageProps = {
  title: string
  description: string
  children?: React.ReactNode
}

export function SectionPage({ title, description, children }: SectionPageProps) {
  return (
    <section className="space-y-8 p-1 font-poppins">
      <div className="space-y-1.5">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-base text-muted-foreground font-medium">{description}</p>
      </div>

      {children ? (
        <div>
          {children}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/50">
          <CardHeader>
            <CardTitle className="text-foreground">{title}</CardTitle>
            <CardDescription>Workspace Section Placeholder</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 py-20 flex items-center justify-center italic">
            Management interface for {title.toLowerCase()} is coming soon.
          </CardContent>
        </Card>
      )}
    </section>
  )
}
