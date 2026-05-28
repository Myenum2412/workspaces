"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDownIcon } from "lucide-react"
import { API_BASE_URL } from "@/lib/api/config"
import { io } from "socket.io-client"

const STATUS_OPTIONS = ["Online", "Lunch Break", "In a Meeting", "Away", "Offline"]

export function HeaderStatusUpdater() {
  const [status, setStatus] = React.useState("Online")
  const [socket, setSocket] = React.useState<any>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let newSocket: any = null;
    async function init() {
      const token = localStorage.getItem("auth_token")
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const data = await res.json()
        if (data.user?.$id) {
          setUserId(data.user.$id)
          newSocket = io(API_BASE_URL)
          setSocket(newSocket)
          newSocket.on("connect", () => {
            newSocket.emit("identify", data.user.$id)
          })
          
          newSocket.on("presence_update", (payload: any) => {
            if (payload.userId === data.user.$id && payload.status) {
              setStatus(payload.status)
            } else if (payload.userId === data.user.$id) {
              setStatus(payload.online ? "Online" : "Offline")
            }
          })
        }
      } catch {}
    }
    init()
    
    return () => {
      if (newSocket) newSocket.disconnect()
    }
  }, [])

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    if (socket && userId) {
      socket.emit("manual_status", { userId, status: newStatus })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 border-slate-200 bg-background text-sm font-medium text-slate-700 hover:bg-slate-50">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${status === "Online" ? "bg-emerald-500" : status === "Offline" ? "bg-slate-300" : "bg-amber-500"}`} />
            {status}
            <ChevronDownIcon className="size-3 text-slate-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${s === "Online" ? "bg-emerald-500" : s === "Offline" ? "bg-slate-300" : "bg-amber-500"}`} />
              {s}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
