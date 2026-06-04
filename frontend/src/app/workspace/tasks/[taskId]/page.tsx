"use client"

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatWindow } from "@/components/chat/chat-window"
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const [task, setTask] = useState<{ title: string; description: string; status: string; priority: string; assignedTo: string[]; assignedToNames: string[]; dueDate: string | null } | null>(null)
  const [chatRoom, setChatRoom] = useState<{ id: string } | null>(null)
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTask = useCallback(() => {
    setTask({ title: "Task", description: "No description available", status: "pending", priority: "Medium", assignedTo: [], assignedToNames: [], dueDate: null })
    setCurrentUserId("local-user")
  }, [])

  useEffect(() => {
    if (taskId) loadTask()
  }, [taskId, loadTask])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">{error || "Task not found"}</p>
        <Link href="/workspace/tasks" className="text-sm text-primary hover:underline">
          ← Back to Tasks
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workspace/tasks" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={task.status === "completed" ? "default" : "secondary"}>
              {task.status}
            </Badge>
            <Badge variant="outline">{task.priority} priority</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Task Details</TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Direct Discussion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-500">Description</h4>
                <p className="mt-1 text-sm text-zinc-900">{task.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Assigned To</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {task.assignedToNames?.join(", ") || "Unassigned"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Due Date</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          {chatRoom ? (
            <div className="h-[600px]">
              <ChatWindow
                chatId={chatRoom.id}
                participants={participants}
                currentUserId={currentUserId}
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Chat requires a database connection.</p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}
