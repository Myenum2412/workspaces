"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { whatsappService, type WhatsappChat, type WhatsappMessage } from "@/lib/whatsapp/service";
import { useWhatsappSocket } from "@/hooks/use-whatsapp-socket";
import { useOrgAuth } from "@/app/org-menu/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function MessageBubble({ message }: { message: any }) {
  const isMine = message.fromMe;
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? "bg-emerald-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-900 rounded-bl-sm"}`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-slate-400"}`}>
          {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const { session } = useOrgAuth();
  const organizationId = (session?.organization as any)?.$id;
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ["whatsapp-chats", organizationId],
    queryFn: () => whatsappService.getChats(),
    enabled: !!organizationId,
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["whatsapp-messages", selectedChat],
    queryFn: () => whatsappService.getMessages(selectedChat!),
    enabled: !!selectedChat,
    refetchInterval: 5000,
  });

  useWhatsappSocket(organizationId, undefined, useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
    if (selectedChat) queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedChat] });
  }, [queryClient, selectedChat]));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !selectedChat) return;
    try {
      await whatsappService.sendMessage(selectedChat, text.trim());
      setText("");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedChat] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const filteredChats = chats.filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.jid?.includes(search)
  );
  const chatObj = chats.find((c: any) => c.jid === selectedChat);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
      {/* Chat List */}
      <Card className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col`}>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search chats..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No chats yet</p>
            </div>
          ) : filteredChats.map((chat: any) => (
            <button key={chat._id} onClick={() => setSelectedChat(chat.jid)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 ${selectedChat === chat.jid ? "bg-emerald-50 border-l-2 border-emerald-500" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0">
                {(chat.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">{chat.name || chat.jid?.split("@")[0]}</span>
                <span className="text-xs text-slate-500 truncate block">{chat.lastMessageText || "No messages"}</span>
              </div>
              {chat.unreadCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{chat.unreadCount}</span>
              )}
            </button>
          ))}
        </ScrollArea>
      </Card>

      {/* Chat View */}
      <Card className={`${selectedChat ? "md:col-span-2 flex flex-col" : "hidden md:flex md:col-span-2 md:flex-col"}`}>
        {selectedChat ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b">
              <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)} className="md:hidden">←</Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">{(chatObj?.name || "?")[0]?.toUpperCase()}</div>
              <div>
                <p className="font-medium text-sm">{chatObj?.name || selectedChat.split("@")[0]}</p>
                {chatObj?.isGroup && <Badge variant="outline" className="text-[10px]">Group</Badge>}
              </div>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No messages yet</div>
              ) : messages.map((msg: any) => <MessageBubble key={msg._id} message={msg} />)}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Type a message..." className="flex-1" />
                <Button onClick={handleSend} disabled={!text.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-sm">Select a chat to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}
