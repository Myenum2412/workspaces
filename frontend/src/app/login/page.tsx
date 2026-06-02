import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-foreground lg:block">
        <div className="relative flex h-full flex-col justify-between p-12 text-background">
          <div className="max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
              Your Central Workspace
            </p>
            <h2 className="font-heading text-5xl leading-tight font-semibold">
              All your tools, tasks, and teams in one place.
            </h2>
            <p className="text-base text-muted-foreground">
              Manage tasks, track progress, collaborate with your team, and stay on top of everything — all from one simple dashboard.
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-semibold">500+</p>
              <p className="mt-1 text-sm text-muted-foreground">Tasks completed daily</p>
            </div>
            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-semibold">24/7</p>
              <p className="mt-1 text-sm text-muted-foreground">Access from anywhere</p>
            </div>
            <div className="rounded-2xl border border-background/10 bg-background/5 p-4">
              <p className="text-2xl font-semibold">98%</p>
              <p className="mt-1 text-sm text-muted-foreground">Team satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
