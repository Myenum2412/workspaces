"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"
import { io, Socket } from "socket.io-client"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = ["Online", "Lunch Break", "In a Meeting", "Away", "Offline"]

const DOT_COLORS: Record<string, string> = {
  Online: "bg-primary",
  "Lunch Break": "bg-amber-500",
  "In a Meeting": "bg-blue-500",
  Away: "bg-orange-500",
  Offline: "bg-slate-300",
  Leave: "bg-red-500",
}

export function HeaderStatusUpdater() {
  const [status, setStatus] = React.useState<string | null>(null)
  const socketRef = React.useRef<Socket | null>(null)
  const userIdRef = React.useRef<string | null>(null)

  // Persist status to DB via REST
  const persistStatus = React.useCallback(async (newStatus: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (err) {
      console.error("[Status] persist failed:", err)
    }
  }, [])

  React.useEffect(() => {
    let destroyed = false

    async function init() {
      const hasCookie = document.cookie.includes("access_token=")
      if (!hasCookie || destroyed) return

      try {
        // Fetch user
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include",
        })
        if (!res.ok || destroyed) return
        const data = await res.json()
        if (!data.user?.$id || destroyed) return

        const uid = data.user.$id
        userIdRef.current = uid

        // Read token from cookie for Socket.IO auth
        const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        const cookieToken = match ? decodeURIComponent(match[1]) : null;
        if (!cookieToken || destroyed) return;

        // Always start as Online on fresh login — user can change manually
        const savedStatus = "Online"
        if (destroyed) return
        setStatus(savedStatus)

        // Connect socket
        const s = io(API_BASE_URL, {
          auth: { token: cookieToken },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        })
        socketRef.current = s

        s.on("connect", () => {
          s.emit("identify", uid, savedStatus)
        })

        s.on("presence_update", (payload: any) => {
          if (payload.userId === uid && payload.status) {
            setStatus(payload.status)
          } else if (payload.userId === uid) {
            setStatus(payload.online ? "Online" : "Offline")
          }
        })

        s.on("disconnect", (reason: string) => {
          console.log(`[Status] Socket disconnected: ${reason}`)
        })

        s.on("connect_error", (err: Error) => {
          console.error("[Status] Socket error:", err.message)
        })

        // Heartbeat every 30s
        const heartbeat = setInterval(() => {
          if (s.connected) s.emit("heartbeat")
        }, 30000)

        return () => {
          clearInterval(heartbeat)
        }
      } catch (err) {
        console.error("[Status] Init error:", err)
      }
    }

    const cleanup = init()

    return () => {
      destroyed = true
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const handleStatusChange = React.useCallback(async (newStatus: string) => {
    setStatus(newStatus)
    // Persist via REST (reliable)
    await persistStatus(newStatus)
    // Broadcast via socket (real-time)
    if (socketRef.current?.connected && userIdRef.current) {
      socketRef.current.emit("manual_status", { userId: userIdRef.current, status: newStatus })
    }
  }, [persistStatus])

  const displayStatus = status ?? "Offline"
  const dotColor = DOT_COLORS[displayStatus] || "bg-amber-500"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 border-slate-200 bg-background text-sm font-medium text-slate-700 hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <p>Status: </p>
            <div className={cn("h-2 w-2 rounded-full", dotColor)} />
            {displayStatus}
            <ChevronDown className="size-3 text-slate-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", DOT_COLORS[s] || "bg-slate-300")} />
              {s}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
