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
        <p className="mt-1 text-sm text-muted-foreground">Chat rooms for your assigned tasks and allocated projects.</p>
      </div>

      {chatRooms.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border bg-muted">
          <div className="text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No chat rooms yet.</p>
            <p className="text-xs text-muted-foreground">You'll see chats here when assigned to tasks or allocated to projects.</p>
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
                  className={`w-full text-left p-3 hover:bg-muted transition-colors ${selectedChatId === room.id ? "bg-primary/5 border-r-2 border-emerald-600" : ""}`}>
                  <div className="flex items-center gap-2">
                    {room.entityType === "task" ? <FileText className="size-4 text-muted-foreground" /> : <FolderKanban className="size-4 text-muted-foreground" />}
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
              <div className="h-full flex items-center justify-center border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Select a chat to start discussing.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
