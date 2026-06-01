"use client"

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
import { Loader2, ArrowLeft, MessageSquare, MapPin } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<{ name: string; jobId: string; location: string; contractorName: string; estimatedTons: string; detailingStatus: string; releaseStatus: string; allocatedUsers: string[] } | null>({ name: "Project", jobId: "JOB-001", location: "N/A", contractorName: "N/A", estimatedTons: "N/A", detailingStatus: "N/A", releaseStatus: "N/A", allocatedUsers: [] })
  const [chatRoom, setChatRoom] = useState<{ id: string; participants?: unknown[] } | null>(null)
  const [participants, setParticipants] = useState<{ id: string; name: string }[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("local-user")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    setProject({ name: "Project", jobId: "JOB-001", location: "N/A", contractorName: "N/A", estimatedTons: "N/A", detailingStatus: "N/A", releaseStatus: "N/A", allocatedUsers: [] })
    setCurrentUserId("local-user")
  }, [])

  useEffect(() => {
    if (projectId) loadProject()
  }, [projectId, loadProject])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-500">{error || "Project not found"}</p>
        <Link href="/workspace" className="text-sm text-primary hover:underline">
          ← Back to Workspace
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workspace" className="text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{project.jobId}</Badge>
            {project.location && (
              <span className="text-sm text-zinc-500 flex items-center gap-1">
                <MapPin className="size-3" /> {project.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="size-4" />
            Direct Discussion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Contractor</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {project.contractorName || "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Estimated Tons</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {project.estimatedTons || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Detailing Status</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {project.detailingStatus || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Release Status</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {project.releaseStatus || "N/A"}
                  </p>
                </div>
              </div>
              {project.allocatedUsers && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-500">Allocated Users</h4>
                  <p className="mt-1 text-sm text-zinc-900">
                    {project.allocatedUsers.length} user{project.allocatedUsers.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
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
