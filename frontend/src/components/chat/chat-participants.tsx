"use client"

import { Users } from "lucide-react"

export interface ChatParticipant {
  id: string
  name: string
}

export function ChatParticipants({ participants, currentUserId }: {
  participants: ChatParticipant[]
  currentUserId: string
}) {
  return (
    <div className="w-64 border-l bg-zinc-50 p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-4">
        <Users className="size-4 text-zinc-600" />
        <h3 className="text-sm font-semibold text-zinc-900">
          Participants ({participants.length})
        </h3>
      </div>
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              p.id === currentUserId ? "bg-primary/5 text-primary" : "text-zinc-700"
            }`}
          >
            <div className="size-2 rounded-full bg-primary" />
            <span>{p.name} {p.id === currentUserId ? "(You)" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
