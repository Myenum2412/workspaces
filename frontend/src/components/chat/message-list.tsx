"use client"

import { useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName?: string
  createdAt: string
}

export function MessageList({ messages, currentUserId }: {
  messages: ChatMessage[]
  currentUserId: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        No messages yet. Start the discussion.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4 flex-1">
      {messages.map((msg) => {
        const isOwn = msg.senderId === currentUserId
        return (
          <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwn ? "bg-bg-primary text-primary-foreground" : "bg-zinc-100 text-zinc-900"}`}>
              {!isOwn && (
                <p className="mb-1 text-xs font-medium opacity-70">{msg.senderName || "Unknown"}</p>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`mt-1 text-right text-xs ${isOwn ? "text-primary-foreground/70" : "text-zinc-500"}`}>
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
