"use client"

import { useState } from "react"
import { ChatWindow } from "@/components/chat/chat-window"
import { MessageSquare, FileText, FolderKanban } from "lucide-react"

export default function StaffChatPage() {
  const [chatRooms] = useState<{ id: string; entityType?: string; entityId?: string; entityName?: string }[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedParticipants] = useState<{ id: string; name: string }[]>([])
  const [currentUserId] = useState<string>("")

  const selectedRoom = chatRooms.find((r) => r.id === selectedChatId)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Direct Discussions</h2>
        <p className="mt-1 text-sm text-zinc-600">Chat rooms for your assigned tasks and allocated projects.</p>
      </div>

      {chatRooms.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border bg-zinc-50">
          <div className="text-center">
            <MessageSquare className="mx-auto size-8 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">No chat rooms yet.</p>
            <p className="text-xs text-zinc-400">You'll see chats here when assigned to tasks or allocated to projects.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
          <div className="border rounded-lg bg-white overflow-y-auto">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold">Your Chats ({chatRooms.length})</h3>
            </div>
            <div className="divide-y">
              {chatRooms.map((room) => (
                <button key={room.id} onClick={() => setSelectedChatId(room.id)}
                  className={`w-full text-left p-3 hover:bg-zinc-50 transition-colors ${selectedChatId === room.id ? "bg-emerald-50 border-r-2 border-emerald-600" : ""}`}>
                  <div className="flex items-center gap-2">
                    {room.entityType === "task" ? <FileText className="size-4 text-zinc-500" /> : <FolderKanban className="size-4 text-zinc-500" />}
                    <span className="text-sm font-medium truncate">{room.entityName || room.entityId}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 h-full">
            {selectedRoom ? (
              <ChatWindow chatId={selectedRoom.id} participants={selectedParticipants} currentUserId={currentUserId} />
            ) : (
              <div className="h-full flex items-center justify-center border rounded-lg bg-zinc-50">
                <p className="text-sm text-zinc-500">Select a chat to start discussing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
