"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone, QrCode, Power, RefreshCw, MessageCircle,
  CheckCircle2, XCircle, Loader2, Send, PlusIcon,
  MoreVertical, Trash2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { whatsappService, type WhatsappInstance, type WhatsappChat, type WhatsappMessage } from "@/lib/whatsapp/service";
import { useWhatsappSocket } from "@/hooks/use-whatsapp-socket";
import { useOrgAuth } from "@/app/org-menu/layout";

// ── Status Badge ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: any; className: string; label: string }> = {
    connected: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Connected" },
    connecting: { icon: Loader2, className: "bg-blue-50 text-blue-700 border-blue-200", label: "Connecting..." },
    reconnecting: { icon: RefreshCw, className: "bg-amber-50 text-amber-700 border-amber-200", label: "Reconnecting..." },
    disconnected: { icon: XCircle, className: "bg-red-50 text-red-700 border-red-200", label: "Disconnected" },
  };
  const c = config[status] || config.disconnected;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 ${c.className}`}>
      <Icon className={`h-3 w-3 ${status === "connecting" || status === "reconnecting" ? "animate-spin" : ""}`} />
      {c.label}
    </Badge>
  );
}

// ── QR Code Display ────────────────────────────────────────

function QRCodeDisplay({ qr, onRefresh }: { qr: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg border">
        {qr ? (
          <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64" />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 text-center max-w-xs">
        Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan this QR code
      </p>
      <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
        <RefreshCw className="h-4 w-4" /> Refresh QR
      </Button>
    </div>
  );
}

// ── Chat List ───────────────────────────────────────────────

function ChatList({
  chats,
  selectedChat,
  onSelectChat,
}: {
  chats: WhatsappChat[];
  selectedChat: string | null;
  onSelectChat: (jid: string) => void;
}) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <MessageCircle className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">No chats yet. Connect WhatsApp to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => (
        <button
          key={chat._id}
          onClick={() => onSelectChat(chat.jid)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-100 ${
            selectedChat === chat.jid ? "bg-emerald-50 border border-emerald-200" : ""
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0">
            {chat.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{chat.name || chat.jid.split("@")[0]}</span>
              {chat.lastMessageAt && (
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(chat.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-slate-500 truncate">{chat.lastMessageText || "No messages yet"}</span>
              {chat.unreadCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
          {chat.isGroup && (
            <Badge variant="outline" className="text-xs shrink-0">Group</Badge>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Message Bubble ──────────────────────────────────────────

function MessageBubble({ message }: { message: WhatsappMessage }) {
  const isMine = message.fromMe;
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMine
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-900 rounded-bl-sm"
        }`}
      >
        {!isMine && message.senderName && (
          <p className="text-xs font-semibold text-emerald-600 mb-0.5">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.messageText}</p>
        <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-200" : "text-slate-400"}`}>
          {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          {isMine && (
            <span className="ml-1">
              {message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Chat View ───────────────────────────────────────────────

function ChatView({
  jid,
  messages,
  onSendMessage,
  onBack,
}: {
  jid: string;
  messages: WhatsappMessage[];
  onSendMessage: (text: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <Send className="h-4 w-4 rotate-180" />
        </Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
          {jid[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm">{jid.split("@")[0]}</p>
          <p className="text-xs text-slate-400">{jid}</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-sm">No messages yet. Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!text.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function WhatsappPage() {
  const { session } = useOrgAuth();
  const organizationId = (session?.organization as any)?.$id;
  const queryClient = useQueryClient();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("instance");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch instance
  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["whatsapp-instances", organizationId],
    queryFn: () => whatsappService.getInstances(),
    enabled: !!organizationId,
  });

  const instance = instances[0] as WhatsappInstance | undefined;
  const isConnected = instance?.connectionStatus === "connected";

  // Fetch chats
  const { data: chats = [] } = useQuery({
    queryKey: ["whatsapp-chats", organizationId],
    queryFn: () => whatsappService.getChats(),
    enabled: !!organizationId && isConnected,
    refetchInterval: 10000,
  });

  // Fetch messages for selected chat
  const { data: messages = [] } = useQuery({
    queryKey: ["whatsapp-messages", selectedChat],
    queryFn: () => whatsappService.getMessages(selectedChat!),
    enabled: !!selectedChat && isConnected,
    refetchInterval: 5000,
  });

  // Socket.io for real-time updates
  useWhatsappSocket(
    organizationId,
    useCallback((data: any) => {
      if (data.status === "connected") {
        setQrCode(null);
        queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
        queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
      }
      if (data.status === "disconnected") {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
      }
    }, [queryClient]),
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
      if (selectedChat) {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedChat] });
      }
    }, [queryClient, selectedChat])
  );

  // Actions
  const handleConnect = async () => {
    try {
      const data = await whatsappService.connect();
      setQrCode(data.qr);
      toast.success("QR code generated. Scan it with WhatsApp.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate QR code");
    }
  };

  const handleDisconnect = async () => {
    try {
      await whatsappService.disconnect();
      toast.success("Disconnected");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this WhatsApp instance? All data will be lost.")) return;
    try {
      await whatsappService.deleteInstance();
      setQrCode(null);
      toast.success("Instance deleted");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChat) return;
    try {
      await whatsappService.sendMessage(selectedChat, text);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", selectedChat] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-chats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">WhatsApp</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your WhatsApp business connection</p>
        </div>
        <div className="flex items-center gap-2">
          {instance && <StatusBadge status={instance.connectionStatus} />}
        </div>
      </div>

      {!instance ? (
        // ── No Instance — Create One ────────────────────────
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <Smartphone className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle>Connect WhatsApp</CardTitle>
            <CardDescription>
              Link your WhatsApp account to start messaging customers directly from your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={async () => {
                try {
                  await whatsappService.createInstance("WhatsApp");
                  queryClient.invalidateQueries({ queryKey: ["whatsapp-instances"] });
                  toast.success("WhatsApp instance created!");
                } catch (error: any) {
                  toast.error(error.message);
                }
              }}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : isConnected ? (
        // ── Connected — Show Chats ──────────────────────────
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className={selectedChat ? "hidden md:flex md:flex-col" : "flex flex-col"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Chats</CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-3">
                <ChatList
                  chats={chats}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat View */}
          <Card className={selectedChat ? "md:col-span-2 flex flex-col" : "hidden md:flex md:col-span-2 md:flex-col"}>
            {selectedChat ? (
              <ChatView
                jid={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={() => setSelectedChat(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-sm">Select a chat to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        // — Not Connected — Show QR or Connect ───────────────
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-lg mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instance">Instance</TabsTrigger>
            <TabsTrigger value="connect">Connect</TabsTrigger>
          </TabsList>

          <TabsContent value="instance" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{instance.instanceName}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDisconnect} className="gap-2">
                        <Power className="h-4 w-4" /> Disconnect
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="gap-2 text-red-600">
                        <Trash2 className="h-4 w-4" /> Delete Instance
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
                <CardDescription>
                  Created {new Date(instance.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <StatusBadge status={instance.connectionStatus} />
                </div>
                {instance.autoReconnect && (
                  <p className="text-xs text-slate-500">Auto-reconnect is enabled. The system will attempt to reconnect automatically if the connection drops.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connect" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan QR Code
                </CardTitle>
                <CardDescription>
                  Scan the QR code with your WhatsApp to connect.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrCode ? (
                  <QRCodeDisplay qr={qrCode} onRefresh={handleConnect} />
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50">
                      <QrCode className="h-10 w-10 text-emerald-600" />
                    </div>
                    <Button onClick={handleConnect} className="bg-emerald-600 hover:bg-emerald-00 gap-2">
                      <QrCode className="h-4 w-4" />
                      Generate QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}


