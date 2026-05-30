"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  MessageCircle, CircleDot, Users, Settings, Search, MoreVertical,
  Plus, Filter, Archive, Star, Trash2, X, Check, ChevronDown,
  Phone, Lock, Image, Paperclip, Smile, Mic, Send,
  UserPlus, LogOut, PhoneOff, Video, Ellipsis,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { openwaApi } from "@/lib/whatsapp/openwa-api";
import { useWhatsappSocket } from "@/hooks/use-whatsapp-socket";

// ─── Types ──────────────────────────────────────────────────

export interface WaSession {
  _id: string;
  name: string;
  status: "created" | "initializing" | "qr_ready" | "authenticating" | "ready" | "disconnected" | "failed";
  phone: string | null;
  pushName: string | null;
  createdAt: string;
}

export interface WaChat {
  _id: string;
  sessionId: string;
  chatId: string;
  name: string;
  isGroup: boolean;
  isArchived: boolean;
  isMuted: boolean;
  isPinned: boolean;
  unreadCount: number;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  lastMessageType: string | null;
  typing: boolean;
  profilePicUrl: string | null;
}

export interface WaMessage {
  _id: string;
  sessionId: string;
  waMessageId: string;
  chatId: string;
  from: string;
  to: string;
  body: string | null;
  type: string;
  direction: "incoming" | "outgoing";
  timestamp: number;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  fromMe: boolean;
  senderName?: string;
  senderPicUrl?: string;
  quotedMsgBody?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
}

export interface WaContact {
  _id: string;
  waContactId: string;
  name: string | null;
  pushName: string | null;
  phone: string | null;
  profilePicUrl: string | null;
  isBlocked: boolean;
}

type LeftTab = "chats" | "status" | "communities" | "settings";
type RightPanel = "none" | "contact-info" | "group-info" | "starred" | "settings-panel";

// ─── Context ────────────────────────────────────────────────

import { createContext, useContext } from "react";

interface WhatsappCtx {
  sessions: WaSession[];
  activeSession: WaSession | null;
  setActiveSession: (s: WaSession) => void;
  chats: WaChat[];
  selectedChat: WaChat | null;
  setSelectedChat: (c: WaChat | null) => void;
  messages: WaMessage[];
  selectedContact: WaContact | null;
  setSelectedContact: (c: WaContact | null) => void;
  rightPanel: RightPanel;
  setRightPanel: (p: RightPanel) => void;
  leftTab: LeftTab;
  setLeftTab: (t: LeftTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showNewChat: boolean;
  setShowNewChat: (v: boolean) => void;
  showQR: boolean;
  setShowQR: (v: boolean) => void;
  qrCode: string | null;
  initializingSession: boolean;
}

const Ctx = createContext<WhatsappCtx | null>(null);
export const useWaContext = () => useContext(Ctx)!;

// ─── Main Layout Component ──────────────────────────────────

export default function WhatsappLayout() {
  const queryClient = useQueryClient();

  // Sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["wa-sessions"],
    queryFn: () => openwaApi.sessions.list(),
    refetchInterval: 10000,
  });

  const [activeSession, setActiveSessionState] = useState<WaSession | null>(null);
  const setActiveSession = useCallback((s: WaSession) => {
    setActiveSessionState(s);
    setSelectedChat(null);
    setRightPanel("none");
  }, []);

  // Auto-select first ready session
  useEffect(() => {
    if (!activeSession && sessions.length > 0) {
      const ready = sessions.find((s: WaSession) => s.status === "ready");
      if (ready) setActiveSessionState(ready);
    }
  }, [sessions, activeSession]);

  // Chats
  const { data: chats = [] } = useQuery({
    queryKey: ["wa-chats", activeSession?._id],
    queryFn: async () => {
      const groups = await openwaApi.sessions.groups(activeSession!._id);
      return (groups as any[]).map((grp: any) => ({
        _id: grp.id, sessionId: activeSession!._id, chatId: grp.id, name: grp.name,
        isGroup: true, isArchived: false, isMuted: false, isPinned: false,
        unreadCount: 0, lastMessageText: null, lastMessageAt: null, lastMessageType: null,
        typing: false, profilePicUrl: null,
      }));
    },
    enabled: !!activeSession?._id && activeSession?.status === "ready",
    refetchInterval: 8000,
  });

  const [selectedChat, setSelectedChat] = useState<WaChat | null>(null);
  const [selectedContact, setSelectedContact] = useState<WaContact | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");
  const [leftTab, setLeftTab] = useState<LeftTab>("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [initializingSession, setInitializingSession] = useState(false);

  // Messages
  const { data: messages = [] } = useQuery({
    queryKey: ["wa-messages", activeSession?._id, selectedChat?.chatId],
    queryFn: () => openwaApi.messages.list(activeSession!._id, selectedChat!.chatId).then((r: any) => r.messages || []),
    enabled: !!activeSession?._id && !!selectedChat?.chatId && activeSession?.status === "ready",
    refetchInterval: 3000,
  });

  // Socket
  useWhatsAppSocket(activeSession?._id, {
    onMessage: (msg) => {
      queryClient.setQueryData(["wa-messages", activeSession?._id, msg.chatId], (old: WaMessage[] = []) => {
        if (old.find(m => m.waMessageId === msg.waMessageId)) return old;
        return [...old, msg];
      });
      // Update chat list unread
      queryClient.invalidateQueries({ queryKey: ["wa-chats"] });
    },
    onSessionStatus: ({ status }) => {
      queryClient.invalidateQueries({ queryKey: ["wa-sessions"] });
      if (status === "ready") toast.success("WhatsApp connected!");
      if (status === "disconnected") toast.warning("WhatsApp disconnected");
    },
  });

  const ctx: WhatsappCtx = {
    sessions, activeSession, setActiveSession,
    chats, selectedChat, setSelectedChat,
    messages, selectedContact, setSelectedContact,
    rightPanel, setRightPanel,
    leftTab, setLeftTab,
    searchQuery, setSearchQuery,
    showNewChat, setShowNewChat,
    showQR, setShowQR, qrCode, initializingSession,
  };

  return (
    <Ctx.Provider value={ctx}>
      <div className="flex h-[calc(100vh-64px)] bg-[#111b21] overflow-hidden">
        {/* ── Left Sidebar ── */}
        <div className="w-[380px] flex flex-col border-r border-[#2a3942] bg-[#111b21] shrink-0">
          <SidebarHeader />
          <TabsBar activeTab={leftTab} onTabChange={setLeftTab} />
          <SidebarContent tab={leftTab} />
        </div>

        {/* ── Main Panel ── */}
        <div className="flex-1 flex flex-col bg-[#0b141a] min-w-0">
          {selectedChat ? (
            <>
              <ChatHeader />
              <div className="flex flex-1 min-h-0">
                <div className="flex-1 flex flex-col min-w-0">
                  <ChatMessages />
                  <ChatInput />
                </div>
                {rightPanel !== "none" && <RightSidePanel />}
              </div>
            </>
          ) : (
            <EmptyMainScreen />
          )}
        </div>
      </div>

      {/* ── QR Dialog ── */}
      {showQR && (
        <QRDialog qrCode={qrCode} onClose={() => setShowQR(false)} />
      )}

      {/* ── New Chat Dialog ── */}
      {showNewChat && <NewChatDialog />}
    </Ctx.Provider>
  );
}

// ─── Sidebar Header ─────────────────────────────────────────

function SidebarHeader() {
  const { sessions, activeSession, setActiveSession, setShowQR } = useWaContext();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#202c33]">
      {/* Session selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2a3942] transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/whatsapp-avatar.png" />
              <AvatarFallback className="bg-[#00a884] text-white text-xs font-bold">
                {activeSession?.name?.substring(0, 2).toUpperCase() ?? "WA"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium text-[#e9edef]">
                {activeSession?.name ?? "WhatsApp"}
              </p>
              <p className="text-[10px] text-[#8696a0]">
                {activeSession?.status === "ready" ? (
                  <span className="text-[#00a884]">Connected</span>
                ) : activeSession ? (
                  <span className="text-[#f1a23b] capitalize">{activeSession.status}</span>
                ) : (
                  "No session"
                )}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#8696a0]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" className="w-[280px] bg-[#202c33] border-[#2a3942] text-white">
          <DropdownMenuItem onClick={() => setShowQR(true)} className="hover:bg-[#2a3942] gap-2">
            <Plus className="h-4 w-4 text-[#00a884]" /> Add Session
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#2a3942]" />
          {sessions.map((s: WaSession) => (
            <DropdownMenuItem
              key={s._id}
              onClick={() => setActiveSession(s)}
              className={`hover:bg-[#2a3942] gap-2 ${activeSession?._id === s._id ? "bg-[#2a3942]" : ""}`}
            >
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                s.status === "ready" ? "bg-[#00a884]" : s.status === "disconnected" ? "bg-[#ef4444]" : "bg-[#f1a23b]"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{s.name}</p>
                {s.phone && <p className="text-[10px] text-[#8696a0]">{s.phone}</p>}
              </div>
              {activeSession?._id === s._id && <Check className="h-4 w-4 text-[#00a884]" />}
            </DropdownMenuItem>
          ))}
          {sessions.length === 0 && (
            <div className="px-3 py-4 text-center text-[#8696a0] text-xs">
              No sessions. Create one to get started.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right action buttons */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-[#2a3942] transition-colors">
              <MoreVertical className="h-5 w-5 text-[#8696a0]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-[#202c33] border-[#2a3942] text-white">
            <DropdownMenuItem onClick={() => setShowQR(true)} className="hover:bg-[#2a3942] gap-2">
              <Plus className="h-4 w-4" /> New session
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Phone className="h-4 w-4" /> New call
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Star className="h-4 w-4" /> Starred messages
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a3942]" />
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Tabs Bar ───────────────────────────────────────────────

function TabsBar({ activeTab, onTabChange }: { activeTab: LeftTab; onTabChange: (t: LeftTab) => void }) {
  const tabs: { id: LeftTab; icon: typeof MessageCircle; label: string }[] = [
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "status", icon: CircleDot, label: "Status" },
    { id: "communities", icon: Users, label: "Communities" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex items-center bg-[#111b21] px-2 gap-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-colors text-xs font-medium ${
            activeTab === tab.id
              ? "bg-[#00a884] text-white"
              : "text-[#8696a0] hover:bg-[#182229]"
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Sidebar Content ────────────────────────────────────────

function SidebarContent({ tab }: { tab: LeftTab }) {
  if (tab === "chats") return <ChatsList />;
  if (tab === "status") return <StatusList />;
  if (tab === "communities") return <CommunitiesList />;
  if (tab === "settings") return <SettingsPanel />;
  return null;
}

// ─── Chats List ─────────────────────────────────────────────

function ChatsList() {
  const {
    activeSession, chats, selectedChat, setSelectedChat,
    searchQuery, setSearchQuery, setRightPanel,
  } = useWaContext();

  const [filterUnread, setFilterUnread] = useState(false);

  const filteredChats = chats
    .filter(c => {
      if (filterUnread && c.unreadCount === 0) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.lastMessageText?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return ((b.lastMessageAt ?? "") > (a.lastMessageAt ?? "") ? 1 : -1);
    });

  const handleSelectChat = (chat: WaChat) => {
    setSelectedChat(chat);
    setRightPanel("none");
  };

  return (
    <>
      {/* Search */}
      <div className="px-3 py-2 bg-[#111b21]">
        <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-[#8696a0] shrink-0" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4 text-[#8696a0]" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterUnread ? "bg-[#00a884] text-white" : "bg-[#202c33] text-[#8696a0]"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Chat list */}
      <ScrollArea className="flex-1">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8696a0]">
            <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">
              {searchQuery ? "No chats found" : "No chats yet. Connect WhatsApp to get started."}
            </p>
          </div>
        ) : (
          filteredChats.map(chat => <ChatListItem key={chat._id} chat={chat} />)
        )}
      </ScrollArea>
    </>
  );
}

function ChatListItem({ chat }: { chat: WaChat }) {
  const { selectedChat, setSelectedChat, setRightPanel } = useWaContext();
  const isSelected = selectedChat?._id === chat._id;

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" });
  };

  const getMessageIcon = (type: string | null, direction: string) => {
    if (type === "image") return "📷";
    if (type === "video") return "🎬";
    if (type === "audio") return "🎵";
    if (type === "document") return "📄";
    if (type === "sticker") return "🩹";
    if (direction === "outgoing") return "  ";
    return null;
  };

  return (
    <div
      onClick={() => setSelectedChat(chat)}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-[#1d2b35] transition-colors ${
        isSelected ? "bg-[#2a3942]" : "hover:bg-[#182229]"
      }`}
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-[#2a3942] text-[#00a884] font-semibold">
          {chat.name?.substring(0, 2).toUpperCase() ?? "??"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#e9edef] truncate">{chat.name}</p>
          <span className={`text-[11px] shrink-0 ml-2 ${
            chat.unreadCount > 0 ? "text-[#00a884]" : "text-[#8696a0]"
          }`}>
            {formatTime(chat.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {chat.typing ? (
              <span className="text-xs text-[#00a884] italic">typing...</span>
            ) : (
              <span className="text-xs text-[#8696a0] truncate">
                {getMessageIcon(chat.lastMessageType, "outgoing") && <span className="mr-1">{getMessageIcon(chat.lastMessageType, "outgoing")}</span>}
                {chat.lastMessageText ?? ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {chat.isPinned && <div className="text-[#8696a0]">📌</div>}
            {chat.isMuted && <div className="text-[#8696a0]">🔇</div>}
            {chat.unreadCount > 0 && (
              <span className="bg-[#00a884] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown on hover right */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={e => e.stopPropagation()} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-[#2a3942]">
            <ChevronDown className="h-4 w-4 text-[#8696a0]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px] bg-[#202c33] border-[#2a3942] text-white">
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            <Archive className="h-4 w-4" /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            {chat.isMuted ? <X className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
            {chat.isMuted ? "Unmute" : "Mute"}
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            <Star className="h-4 w-4" /> Pin
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            <Star className="h-4 w-4" /> Mark as unread
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#2a3942]" />
          <DropdownMenuItem onClick={() => setRightPanel(chat.isGroup ? "group-info" : "contact-info")} className="hover:bg-[#2a3942] gap-2">
            <Search className="h-4 w-4" /> {chat.isGroup ? "Group info" : "Contact info"}
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
            <Trash2 className="h-4 w-4" /> Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Chat Header ────────────────────────────────────────────

function ChatHeader() {
  const { selectedChat, setSelectedChat, setRightPanel } = useWaContext();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-l border-[#2a3942] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => setSelectedChat(null)} className="p-1 rounded-full hover:bg-[#2a3942] md:hidden">
          <X className="h-5 w-5 text-[#8696a0]" />
        </button>
        <Avatar
          className="h-10 w-10 cursor-pointer"
          onClick={() => setRightPanel(selectedChat?.isGroup ? "group-info" : "contact-info")}
        >
          <AvatarFallback className="bg-[#2a3942] text-[#00a884] font-semibold text-sm">
            {selectedChat?.name?.substring(0, 2).toUpperCase() ?? "??"}
          </AvatarFallback>
        </Avatar>
        <div
          className="min-w-0 cursor-pointer"
          onClick={() => setRightPanel(selectedChat?.isGroup ? "group-info" : "contact-info")}
        >
          <p className="text-sm font-medium text-[#e9edef] truncate">{selectedChat?.name}</p>
          <p className="text-[11px] text-[#8696a0]">
            {selectedChat?.isGroup ? `${selectedChat.name}` : "last seen today at 12:00"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-[#2a3942]">
              <Video className="h-5 w-5 text-[#8696a0]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#202c33] border-[#2a3942] text-white">
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Phone className="h-4 w-4" /> Voice call
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Video className="h-4 w-4" /> Video call
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button className="p-2 rounded-full hover:bg-[#2a3942]">
          <Search className="h-5 w-5 text-[#8696a0]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-[#2a3942]">
              <Ellipsis className="h-5 w-5 text-[#8696a0]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px] bg-[#202c33] border-[#2a3942] text-white">
            <DropdownMenuItem onClick={() => setRightPanel(selectedChat?.isGroup ? "group-info" : "contact-info")} className="hover:bg-[#2a3942] gap-2">
              <Search className="h-4 w-4" /> {selectedChat?.isGroup ? "Group info" : "Contact info"}
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Star className="h-4 w-4" /> Select messages
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Archive className="h-4 w-4" /> Mute notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
              <Trash2 className="h-4 w-4" /> Clear messages
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
              <Trash2 className="h-4 w-4" /> Delete chat
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
              <PhoneOff className="h-4 w-4" /> Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Chat Messages ──────────────────────────────────────────

function ChatMessages() {
  const { messages, activeSession, selectedChat } = useWaContext();

  // Group messages by date
  const grouped = messages.reduce<{ date: string; msgs: WaMessage[] }[]>((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const last = acc[acc.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      acc.push({ date, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div
      className="flex-1 overflow-y-auto px-12 py-4 space-y-1"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='400' height='400' patternUnits='userSpaceOnUse'%3E%3Ctext x='200' y='100' font-size='20' fill='%23182229' opacity='0.4' text-anchor='middle'%3EWhatsApp Clone%3C/text%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E")` }}
    >
      {grouped.map(group => (
        <div key={group.date}>
          <div className="flex justify-center my-3">
            <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-lg shadow">{group.date}</span>
          </div>
          {group.msgs.map(msg => (
            <MessageBubble key={msg._id} message={msg} />
          ))}
        </div>
      ))}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
          <Lock className="h-8 w-8 mb-3 opacity-40" />
          <p className="text-sm">End-to-end encrypted</p>
          <p className="text-xs mt-1">Your messages are private</p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: WaMessage }) {
  const isOutgoing = message.direction === "outgoing";
  const statusIcon = isOutgoing ? (
    message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : message.status === "sent" ? "✓" : "⏳"
  ) : null;

  if (isOutgoing) {
    return (
      <div className="flex justify-end mb-1">
        <div className="max-w-[65%] bg-[#005c4b] text-white rounded-lg rounded-tr-none px-2 py-1 shadow-sm group relative">
          {message.quotedMsgBody && (
            <div className="border-l-2 border-[#00a884] pl-2 mb-1 text-xs text-[#ffffff99]">{message.quotedMsgBody}</div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] text-[#ffffff99]">
              {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
            <span className={`text-[11px] ${message.status === "read" ? "text-[#53bdeb]" : "text-[#ffffff99]"}`}>{statusIcon}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-1">
      <div className="max-w-[65%] bg-[#202c33] text-white rounded-lg rounded-tl-none px-2 py-1 shadow-sm relative">
        {message.senderName && (
          <p className="text-xs font-medium text-[#00a884] mb-0.5">{message.senderName}</p>
        )}
        {message.quotedMsgBody && (
          <div className="border-l-2 border-[#00a884] pl-2 mb-1 text-xs text-[#ffffff66]">{message.quotedMsgBody}</div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] text-[#ffffff66]">
            {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Input ─────────────────────────────────────────────

function ChatInput() {
  const { activeSession, selectedChat } = useWaContext();
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim() || !activeSession || !selectedChat) return;
    try {
      await openwaApi.messages.sendText(activeSession._id, selectedChat.chatId, text.trim());
      setText("");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#202c33] border-l border-[#2a3942]">
      <button className="p-2 rounded-full hover:bg-[#2a3942]">
        <Smile className="h-5 w-5 text-[#8696a0]" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 rounded-full hover:bg-[#2a3942]">
            <Paperclip className="h-5 w-5 text-[#8696a0]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-[#202c33] border-[#2a3942] text-white">
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            <Image className="h-4 w-4" /> Photos & Videos
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
            <Paperclip className="h-4 w-4" /> Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        type="text"
        placeholder="Type a message"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSend()}
        className="flex-1 bg-[#2a3942] text-sm text-[#e9edef] placeholder-[#8696a0] rounded-lg px-4 py-2.5 outline-none"
      />
      {text.trim() ? (
        <button onClick={handleSend} className="p-2 rounded-full hover:bg-[#2a3942]">
          <Send className="h-5 w-5 text-[#8696a0]" />
        </button>
      ) : (
        <button className="p-2 rounded-full hover:bg-[#2a3942]">
          <Mic className="h-5 w-5 text-[#8696a0]" />
        </button>
      )}
    </div>
  );
}

// ─── Right Side Panel ───────────────────────────────────────

function RightSidePanel() {
  const { rightPanel, setRightPanel, selectedChat } = useWaContext();

  return (
    <div className="w-[340px] flex flex-col border-l border-[#2a3942] bg-[#111b21] shrink-0">
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <h3 className="text-sm font-medium text-[#e9edef]">
          {rightPanel === "contact-info" ? "Contact info" : rightPanel === "group-info" ? "Group info" : "Starred messages"}
        </h3>
        <button onClick={() => setRightPanel("none")} className="p-1 rounded-full hover:bg-[#2a3942]">
          <X className="h-5 w-5 text-[#8696a0]" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center py-6">
          <Avatar className="h-32 w-32 mb-3">
            <AvatarFallback className="bg-[#2a3942] text-[#00a884] font-semibold text-3xl">
              {selectedChat?.name?.substring(0, 2).toUpperCase() ?? "??"}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium text-[#e9edef]">{selectedChat?.name}</p>
          <p className="text-xs text-[#8696a0] mt-1">{selectedChat?.isGroup ? "Group" : "+91 00000 00000"}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 mt-1 text-xs text-[#8696a0] hover:underline">
                More <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-[#202c33] border-[#2a3942] text-white">
              <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
                <Star className="h-4 w-4" /> Search
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#2a3942] gap-2">
                <Archive className="h-4 w-4" /> Report
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
                <PhoneOff className="h-4 w-4" /> Block
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#2a3942] gap-2 text-[#ef4444]">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="px-4 pb-4">
          <div className="bg-[#182229] rounded-lg p-3">
            <p className="text-xs text-[#8696a0] mb-1">About</p>
            <p className="text-sm text-[#e9edef]">Hey there! I am using WhatsApp.</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Empty Main Screen ──────────────────────────────────────

function EmptyMainScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#1d2b35] text-center px-8">
      <div className="max-w-sm">
        <div className="w-64 h-64 mx-auto mb-6 rounded-full bg-[#182229] flex items-center justify-center">
          <svg viewBox="0 0 303 172" width="200" className="opacity-60">
            <path fill="#2a3942" d="M229.565 160.229c32.647 0 59.12-26.473 59.12-59.12 0-32.647-26.473-59.12-59.12-59.12-32.647 0-59.12 26.473-59.12 59.12 0 32.647 26.473 59.12 59.12 59.12z"/>
            <path fill="#2a3942" d="M59.12 101.109c0-32.647 26.473-59.12 59.12-59.12 32.647 0 59.12 26.473 59.12 59.12 0 32.647-26.473 59.12-59.12 59.12-32.647 0-59.12-26.473-59.12-59.12z"/>
          </svg>
        </div>
        <h2 className="text-3xl font-light text-[#e9edef] mb-3">WhatsApp Web</h2>
        <p className="text-sm text-[#8696a0] leading-relaxed mb-6">
          Send and receive messages without keeping your phone online.
          <br />
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>
        <Separator className="bg-[#2a3942] mb-4" />
        <p className="text-xs text-[#8696a0]">🔒 End-to-end encrypted</p>
      </div>
    </div>
  );
}

// ─── Status List ────────────────────────────────────────────

function StatusList() {
  const { activeSession } = useWaContext();
  const { data: statuses = [] } = useQuery({
    queryKey: ["wa-statuses", activeSession?._id],
    queryFn: () => Promise.resolve([]) as any,
    enabled: !!activeSession?._id && activeSession?.status === "ready",
  });

  return (
    <ScrollArea className="flex-1">
      <div className="p-3">
        {/* My Status */}
        <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#182229] rounded-lg">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[#2a3942] text-[#00a884]">Me</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-[#00a884] rounded-full p-0.5">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#e9edef]">My status</p>
            <p className="text-xs text-[#8696a0]">Tap to add status update</p>
          </div>
        </div>

        <p className="text-xs font-medium text-[#8696a0] px-3 py-3 uppercase">Recent updates</p>

        {statuses.map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#182229] rounded-lg">
            <div className="ring-2 ring-[#00a884] rounded-full p-0.5">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#2a3942] text-white">{s.contact?.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm text-[#e9edef]">{s.contact?.name ?? "Unknown"}</p>
              <p className="text-xs text-[#8696a0]">{s.timestamp ? new Date(s.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
            </div>
          </div>
        ))}

        {statuses.length === 0 && (
          <div className="text-center py-12 text-[#8696a0]">
            <CircleDot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No status updates yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Communities List ───────────────────────────────────────

function CommunitiesList() {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center justify-center py-16 text-[#8696a0]">
        <Users className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No communities yet</p>
        <p className="text-xs mt-1">Create a community to connect groups</p>
      </div>
    </ScrollArea>
  );
}

// ─── Settings Panel ─────────────────────────────────────────

function SettingsPanel() {
  const { activeSession, sessions } = useWaContext();

  return (
    <ScrollArea className="flex-1">
      <div className="p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#182229] rounded-lg">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-[#2a3942] text-[#00a884] text-lg">
              {activeSession?.name?.substring(0, 2).toUpperCase() ?? "WA"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-medium text-[#e9edef]">{activeSession?.name ?? "WhatsApp"}</p>
            <p className="text-xs text-[#8696a0]">{activeSession?.phone ?? "Not connected"}</p>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <SettingsRow icon={<Star className="h-5 w-5" />} label="Starred messages" />
          <SettingsRow icon={<Archive className="h-5 w-5" />} label="Archived chats" />
          <SettingsRow icon={<Lock className="h-5 w-5" />} label="Privacy" />
          <SettingsRow icon={<Phone className="h-5 w-5" />} label="Calls" />
          <SettingsRow icon={<Settings className="h-5 w-5" />} label="Notifications" />
          <SettingsRow icon={<Settings className="h-5 w-5" />} label="Storage and data" />
          <SettingsRow icon={<Settings className="h-5 w-5" />} label="App language" />
          <SettingsRow icon={<Settings className="h-5 w-5" />} label="Help" />
          <SettingsRow icon={<LogOut className="h-5 w-5 text-[#ef4444]" />} label="Log out" danger />
        </div>
      </div>
    </ScrollArea>
  );
}

function SettingsRow({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-3 py-3 cursor-pointer hover:bg-[#182229] rounded-lg ${danger ? "text-[#ef4444]" : "text-[#e9edef]"}`}>
      <span className={danger ? "text-[#ef4444]" : "text-[#8696a0]"}>{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

// ─── QR Dialog ──────────────────────────────────────────────

function QRDialog({ qrCode, onClose }: { qrCode: string | null; onClose: () => void }) {
  const [newSessionName, setNewSessionName] = useState("");
  const [creating, setCreating] = useState(false);
  const [qr, setQr] = useState<string | null>(qrCode);
  const [status, setStatus] = useState("created");

  const handleCreate = async () => {
    if (!newSessionName.trim()) return;
    try {
      setCreating(true);
      const session = await openwaApi.sessions.create(newSessionName.trim());
      await openwaApi.sessions.start(session._id);
      // Poll for QR
      const interval = setInterval(async () => {
        try {
          const qrData = await openwaApi.sessions.qr(session._id);
          setQr(qrData.qrCode);
          setStatus(qrData.status);
          if (qrData.status === "ready") {
            clearInterval(interval);
            toast.success("WhatsApp connected!");
            onClose();
          }
        } catch (_e) {
          // keep polling
        }
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to create session");
      setCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#111b21] border-[#2a3942] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">Link a device</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            {!qr ? "Scan the QR code with your WhatsApp app" : "Enter a name for this session"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {!qr ? (
            <div className="flex flex-col items-center gap-3">
              <Input
                placeholder="Session name (e.g., main)"
                value={newSessionName}
                onChange={e => setNewSessionName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="bg-[#202c33] border-[#2a3942] text-white"
              />
              <Button onClick={handleCreate} disabled={creating || !newSessionName.trim()} className="w-full bg-[#00a884] hover:bg-[#06cf9c]">
                {creating ? "Creating..." : "Create Session"}
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl">
                {qr.startsWith("data:") ? (
                  <img src={qr} alt="QR Code" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100">
                    <p className="text-xs text-slate-500">Loading QR...</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8696a0] text-center">
                Open WhatsApp → Settings → Linked Devices → Link a Device → Scan this QR
              </p>
              <Badge className={`${
                status === "ready" ? "bg-emerald-500" : status === "qr_ready" ? "bg-amber-500" : "bg-blue-500"
              } text-white capitalize`}>
                {status}
              </Badge>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Chat Dialog ────────────────────────────────────────

function NewChatDialog() {
  const { setShowNewChat } = useWaContext();
  const [tab, setTab] = useState<"contacts" | "groups">("contacts");

  return (
    <Dialog open onOpenChange={() => setShowNewChat(false)}>
      <DialogContent className="max-w-md bg-[#111b21] border-[#2a3942] text-white">
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setTab("contacts")} className={`flex-1 py-2 rounded-lg text-sm ${tab === "contacts" ? "bg-[#00a884] text-white" : "bg-[#202c33] text-[#8696a0]"}`}>
            Contacts
          </button>
          <button onClick={() => setTab("groups")} className={`flex-1 py-2 rounded-lg text-sm ${tab === "groups" ? "bg-[#00a884] text-white" : "bg-[#202c33] text-[#8696a0]"}`}>
            New group
          </button>
        </div>
        <div className="bg-[#202c33] rounded-lg px-3 py-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-[#8696a0]" />
          <input placeholder="Search name or number" className="flex-1 bg-transparent text-sm text-white outline-none" />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col items-center justify-center py-12 text-[#8696a0]">
            <UserPlus className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">{tab === "contacts" ? "No contacts synced yet" : "Create a new group"}</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Socket hook wrapper ────────────────────────────────────

function useWhatsAppSocket(sessionId: string | undefined, handlers: { onMessage?: (msg: any) => void; onSessionStatus?: (data: any) => void }) {
  useWhatsappSocket(sessionId, handlers.onSessionStatus, handlers.onMessage);
  return null;
}
