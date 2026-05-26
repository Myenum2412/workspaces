"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

export function MessageInput({ onSend, disabled }: {
  onSend: (content: string) => void | Promise<void>
  disabled?: boolean
}) {
  const [content, setContent] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || disabled) return
    setContent("")
    await onSend(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3 bg-white">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as any)
          }
        }}
      />
      <Button
        type="submit"
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        disabled={disabled || !content.trim()}
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
