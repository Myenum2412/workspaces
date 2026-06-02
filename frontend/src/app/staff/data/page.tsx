import { DatabaseIcon, GaugeIcon, KeyIcon, ListFilterIcon } from "lucide-react"

const collections = [
  { name: "users", key: "displayId, email, roleName", purpose: "profile routing" },
  { name: "webrtc_rooms", key: "participantIds, status", purpose: "session metadata" },
  { name: "webrtc_participants", key: "roomId, userId", purpose: "presence state" },
  { name: "webrtc_signals", key: "roomId, recipientId, sequence", purpose: "signaling events" },
  { name: "webrtc_metrics", key: "roomId, event", purpose: "connection telemetry" },
]

export default function DataPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Data Layer</h2>
        <p className="mt-1 text-sm text-muted-foreground">Collections and indexes used by backend staff workflows.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border bg-background p-5 ">
          <GaugeIcon className="mb-4 size-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Read Pattern</p>
          <p className="mt-2 text-2xl font-semibold">Indexed filters</p>
        </div>
        <div className="rounded-lg border bg-background p-5 ">
          <KeyIcon className="mb-4 size-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Access Pattern</p>
          <p className="mt-2 text-2xl font-semibold">Row permissions</p>
        </div>
        <div className="rounded-lg border bg-background p-5 ">
          <ListFilterIcon className="mb-4 size-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Payload Pattern</p>
          <p className="mt-2 text-2xl font-semibold">Bounded lists</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background ">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <DatabaseIcon className="size-5 text-primary" />
          <h3 className="font-semibold">Collections</h3>
        </div>
        <div className="divide-y">
          {collections.map((collection) => (
            <div key={collection.name} className="grid gap-3 px-5 py-4 text-sm md:grid-cols-3">
              <span className="font-medium">{collection.name}</span>
              <span className="text-muted-foreground">{collection.key}</span>
              <span className="text-muted-foreground">{collection.purpose}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
