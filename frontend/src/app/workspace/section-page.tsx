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
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-base text-slate-500 font-medium">{description}</p>
      </div>

      {children ? (
        <div>
          {children}
        </div>
      ) : (
        <Card className="border-dashed bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-slate-700">{title}</CardTitle>
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
