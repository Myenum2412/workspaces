import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ComingSoonProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <span className="text-sm font-medium">Under development</span>
              <span className="text-xs">This module will be available in an upcoming release.</span>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  )
}
