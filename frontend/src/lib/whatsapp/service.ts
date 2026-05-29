/**
 * WhatsApp API service — communicates with backend WhatsApp routes.
 * All calls are tenant-isolated via JWT token.
 */

import { API_BASE_URL } from "@/lib/api/config";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Request failed");
  }
  return res.json();
}

// ── Types ────────────────────────────────────────────────────

export interface WhatsappInstance {
  _id: string;
  organizationId: string;
  workspaceOwnerId: string;
  instanceName: string;
  connectionStatus: "disconnected" | "connecting" | "connected" | "reconnecting";
  lastConnectedAt?: string;
  phoneNumber?: string;
  pushName?: string;
  profilePicUrl?: string;
  autoReconnect: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappChat {
  _id: string;
  jid: string;
  name?: string;
  isGroup: boolean;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageSender?: string;
  unreadCount: number;
  profilePicUrl?: string;
}

export interface WhatsappMessage {
  _id: string;
  messageId: string;
  jid: string;
  fromMe: boolean;
  senderJid: string;
  senderName?: string;
  messageType: string;
  messageText?: string;
  mediaUrl?: string;
  status: string;
  createdAt: string;
}

export interface QRCodeData {
  qr: string;
  timestamp: string;
}

// ── Service ──────────────────────────────────────────────────

export const whatsappService = {
  // Instance management
  async getInstances(): Promise<WhatsappInstance[]> {
    const { instances } = await apiFetch("/api/whatsapp/instances");
    return instances || [];
  },

  async createInstance(instanceName: string): Promise<{ instance: WhatsappInstance }> {
    return apiFetch("/api/whatsapp/instances", {
      method: "POST",
      body: JSON.stringify({ instanceName }),
    });
  },

  async deleteInstance(): Promise<void> {
    return apiFetch("/api/whatsapp/instances", { method: "DELETE" });
  },

  // Connection
  async connect(): Promise<QRCodeData> {
    return apiFetch("/api/whatsapp/connect", { method: "POST" });
  },

  async disconnect(): Promise<void> {
    return apiFetch("/api/whatsapp/disconnect", { method: "POST" });
  },

  async getStatus(): Promise<{ instance: WhatsappInstance | null; connected: boolean }> {
    return apiFetch("/api/whatsapp/status");
  },

  // Messaging
  async sendMessage(to: string, message: string): Promise<any> {
    return apiFetch("/api/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ to, message }),
    });
  },

  // Chats
  async getChats(): Promise<WhatsappChat[]> {
    const { chats } = await apiFetch("/api/whatsapp/chats");
    return chats || [];
  },

  async getMessages(jid: string, limit = 50): Promise<WhatsappMessage[]> {
    const { messages } = await apiFetch(
      `/api/whatsapp/chats/${encodeURIComponent(jid)}/messages?limit=${limit}`
    );
    return messages || [];
  },
};
