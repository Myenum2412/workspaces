"use client"

import { useState, useCallback } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { ChatParticipants } from "./chat-participants"
import { Loader2 } from "lucide-react"

export function ChatWindow({ chatId, participants, currentUserId }: {
  chatId: string
  participants: { id: string; name: string }[]
  currentUserId: string
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async (content: string) => {
    setSending(true)
    try {
      const newMsg = {
        id: String(Date.now()),
        content,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, newMsg])
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }, [currentUserId])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full border rounded-lg bg-white overflow-hidden">
      <div className="flex flex-col flex-1 h-full">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">Direct Discussion</h3>
          <p className="text-xs text-zinc-500">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </p>
        </div>
        <MessageList messages={messages} currentUserId={currentUserId} />
        <MessageInput onSend={handleSend} disabled={sending} />
      </div>
      <ChatParticipants participants={participants} currentUserId={currentUserId} />
    </div>
  )
}
