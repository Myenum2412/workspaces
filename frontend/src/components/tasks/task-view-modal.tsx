"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { 
  Send, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Users,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  MoreVertical
} from "lucide-react"
import { format } from "date-fns"


// UI Components
import { BasicModal } from "@/components/smoothui/basic-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Types
import type { Task } from "@/components/admin/tasks/types"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
}

interface TaskViewModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  isTeamTask?: boolean
}

export function TaskViewModal({ open, onClose, task, isTeamTask = true }: TaskViewModalProps) {
  const teamMembers: Array<{ id: string; name: string; avatar: string }> = []

  const [message, setMessage] = useState("")
  const [mentionQuery, setMentionQuery] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionIndex, setMentionIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, open])

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "https://i.pravatar.cc/150?u=me",
      content: message,
      timestamp: new Date()
    }
    
    setMessages([...messages, newMessage])
    setMessage("")
    setShowMentions(false)
  }

  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return teamMembers
    return teamMembers.filter(m => 
      m.name.toLowerCase().includes(mentionQuery.toLowerCase())
    )
  }, [mentionQuery, teamMembers])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setMessage(val)

    const cursorPosition = e.target.selectionStart || 0
    const textBeforeCursor = val.substring(0, cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbol !== -1) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1)
      // Check if there are spaces between @ and cursor to avoid showing list after a space
      if (!query.includes(' ')) {
        setMentionQuery(query)
        setShowMentions(true)
        setMentionIndex(0)
        return
      }
    }
    setShowMentions(false)
  }

  const selectMember = (name: string) => {
    if (!inputRef.current) return
    const cursorPosition = inputRef.current.selectionStart || 0
    const textBeforeCursor = message.substring(0, cursorPosition)
    const textAfterCursor = message.substring(cursorPosition)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')

    const newMessage = 
      textBeforeCursor.substring(0, lastAtSymbol) + 
      `@${name} ` + 
      textAfterCursor

    setMessage(newMessage)
    setShowMentions(false)
    
    // Focus back and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newPos = lastAtSymbol + name.length + 2 // +1 for @, +1 for space
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => (prev + 1) % Math.max(1, filteredMembers.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % Math.max(1, filteredMembers.length))
      } else if (e.key === 'Enter' && filteredMembers.length > 0) {
        e.preventDefault()
        selectMember(filteredMembers[mentionIndex].name)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowMentions(false)
      } else if (e.key === ' ') {
        setShowMentions(false)
      }
    } else {
      if (e.key === 'Enter') {
        handleSendMessage()
      }
    }
  }

  if (!task) return null


  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-200'
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 'medium': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-primary" />
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <BasicModal
      isOpen={open}
      onClose={onClose}
      size="xl"
      title={`Task Details: ${task.taskNumber || task.id.substring(0, 8)}`}
      className="p-0 overflow-hidden max-w-5xl"
    >
      <div className="flex flex-col md:flex-row h-[min(85vh,750px)] bg-background">
        {/* Left Section: Task Info */}
        <div className={cn(
          "flex-1 overflow-y-auto p-6",
          "border-r border-border/50"
        )}>
          <div className="space-y-8">
            {/* ... title and status ... */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{task.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50">
                      {getStatusIcon(task.status)}
                      <span className="text-xs font-medium capitalize">{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Assignment & Deadline Grid */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-primary/[0.02] border border-primary/5">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Assigned To
                </Label>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {task.assignee_type === 'team' ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{task.assigned_to_team_name || task.assigned_to_staff_name || task.assignedName || "Unassigned"}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{task.assignee_type || "No"} Assignment</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" /> Due Date
                </Label>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{task.due_date ? format(new Date(task.due_date), 'PPP') : "No deadline"}</p>
                    <p className="text-[11px] text-muted-foreground">Scheduled completion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Description</Label>
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {task.description || "No description provided for this task."}
                </p>
              </div>
            </div>

            {/* Attachments Section (Optional) */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Attachments ({task.attachments.length})</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-secondary/50 transition-colors cursor-pointer group">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Discussion Panel */}
        <div className="w-full md:w-[380px] flex flex-col bg-secondary/10">
          {/* Chat Header */}
          <div className="p-4 border-b border-border/50 bg-background/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm tracking-tight">
                {isTeamTask ? "Team Discussion" : "Direct Discussion"}
              </span>
            </div>
            <div className="flex -space-x-2">
              {isTeamTask ? (
                <>
                  {teamMembers.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-7 w-7 border-2 border-background  ring-1 ring-border">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {teamMembers.length > 3 && (
                    <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium ring-1 ring-border">
                      +{teamMembers.length - 3}
                    </div>
                  )}
                </>
              ) : (
                <Avatar className="h-7 w-7 border-2 border-background  ring-1 ring-border">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${task.assigned_to_staff_name}`} alt={task.assigned_to_staff_name} />
                  <AvatarFallback className="text-[10px]">{task.assigned_to_staff_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6">
              <div className="flex justify-center">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 px-2 py-0.5 bg-secondary/50 rounded-full border border-border/30">Today</span>
              </div>
              
              {messages.map((msg) => {
                  const isMe = msg.senderId === "current-user"
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex items-start gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}
                    >
                      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className={cn("flex flex-col gap-1 max-w-[80%]", isMe ? "items-end" : "items-start")}>
                        {!isMe && (
                          <span className="text-[10px] font-bold text-muted-foreground ml-1">{msg.senderName}</span>
                        )}
                        <div className={cn(
                          "px-3 py-2 rounded-2xl text-sm ",
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-background border border-border/50 rounded-tl-none"
                        )}>
                          <p className="leading-tight">{msg.content}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground/70 mx-1">{format(msg.timestamp, 'HH:mm')}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 bg-background border-t border-border/50 relative">
            {showMentions && filteredMembers.length > 0 && (
                <div
                  className="absolute bottom-full left-4 right-4 mb-2 bg-background border border-border  rounded-xl overflow-hidden z-50 max-h-48 flex flex-col"
                >
                  <div className="p-2 border-b border-border bg-secondary/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mention Stakeholder</span>
                  </div>
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-1">
                      {filteredMembers.map((member, idx) => (
                        <button
                          key={member.id}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            idx === mentionIndex ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                          )}
                          onClick={() => selectMember(member.name)}
                          onMouseEnter={() => setMentionIndex(idx)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

            <div className="relative flex items-center gap-2 bg-secondary/30 p-1.5 rounded-xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-background/50">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input 
                ref={inputRef}
                placeholder={isTeamTask ? "Type a message..." : `Message ${task.assigned_to_staff_name?.split(' ')[0]}...`} 
                className="h-8 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm"
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <Button 
                size="icon" 
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg transition-all", 
                  message.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground pointer-events-none"
                )}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 text-center italic">
              {isTeamTask ? "Collaborators will be notified" : "Direct recipient will be notified"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="hidden border-t p-4 md:flex items-center justify-between bg-background/50">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Created {task.created_at ? format(new Date(task.created_at), 'MMM d') : "recently"}</span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>3 members online</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-semibold">Close Details</Button>
          <Button size="sm" className="h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90">Mark as Completed</Button>
        </div>
      </div>
    </BasicModal>
  )
}
