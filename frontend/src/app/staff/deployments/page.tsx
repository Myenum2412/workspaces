import { BoxesIcon, CheckCircle2Icon, ClockIcon, TerminalIcon } from "lucide-react"

const jobs = [
  { name: "Next.js build", command: "npm run build", status: "passing" },
  { name: "Signal cleanup", command: "functions/webrtc-maintenance", status: "scheduled" },
]

export default function DeploymentsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Deployments</h2>
        <p className="mt-1 text-sm text-zinc-600">Release checkpoints for Staff Management.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <div key={job.name} className="rounded-lg border bg-white p-5 ">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  {job.status === "scheduled" ? (
                    <ClockIcon className="size-5" />
                  ) : job.status === "manual" ? (
                    <TerminalIcon className="size-5" />
                  ) : (
                    <CheckCircle2Icon className="size-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{job.name}</h3>
                  <p className="text-sm text-zinc-600">{job.command}</p>
                </div>
              </div>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-5 ">
        <div className="mb-4 flex items-center gap-2">
          <BoxesIcon className="size-5 text-emerald-600" />
          <h3 className="font-semibold">Release Notes</h3>
        </div>
        <div className="space-y-2 text-sm text-zinc-700">
          <p>Run the schema script before enabling WebRTC rooms in production.</p>
          <p>Deploy `functions/webrtc-maintenance` with database read, create, update, and delete scopes.</p>
          <p>Keep realtime subscriptions tied to the authenticated Staff Management session.</p>
        </div>
      </div>
    </section>
  )
}
