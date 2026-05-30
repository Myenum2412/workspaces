/**
 * OpenWA API service — full WhatsApp Business Platform API client.
 * Covers: sessions, messages, chats, contacts, groups, webhooks,
 * campaigns, templates, automation, stats, labels.
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
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export const openwaApi = {
  // ════════════════════════════════════════════════════════════
  // SESSIONS
  // ════════════════════════════════════════════════════════════
  sessions: {
    list: () => apiFetch("/api/openwa/sessions"),
    create: (name: string, config?: Record<string, unknown>) =>
      apiFetch("/api/openwa/sessions", { method: "POST", body: JSON.stringify({ name, config }) }),
    get: (id: string) => apiFetch(`/api/openwa/sessions/${id}`),
    delete: (id: string) => apiFetch(`/api/openwa/sessions/${id}`, { method: "DELETE" }),
    start: (id: string) => apiFetch(`/api/openwa/sessions/${id}/start`, { method: "POST" }),
    stop: (id: string) => apiFetch(`/api/openwa/sessions/${id}/stop`, { method: "POST" }),
    qr: (id: string) => apiFetch(`/api/openwa/sessions/${id}/qr`),
    groups: (id: string) => apiFetch(`/api/openwa/sessions/${id}/groups`),
    stats: () => apiFetch("/api/openwa/sessions/stats/overview"),
  },

  // ════════════════════════════════════════════════════════════
  // MESSAGES
  // ════════════════════════════════════════════════════════════
  messages: {
    list: (sessionId: string, chatId?: string, limit = 50, offset = 0) => {
      const q = new URLSearchParams();
      if (chatId) q.set("chatId", chatId);
      q.set("limit", String(limit));
      q.set("offset", String(offset));
      return apiFetch(`/api/openwa/sessions/${sessionId}/messages?${q}`);
    },
    search: (q: string) => apiFetch(`/api/openwa/messages/search?q=${encodeURIComponent(q)}`),

    // Send
    sendText: (sessionId: string, chatId: string, text: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-text`, {
        method: "POST", body: JSON.stringify({ chatId, text }),
      }),
    sendImage: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-image`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendVideo: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-video`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendAudio: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-audio`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendDocument: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-document`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendLocation: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-location`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendSticker: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-sticker`, {
        method: "POST", body: JSON.stringify(data),
      }),
    sendContact: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-contact`, {
        method: "POST", body: JSON.stringify(data),
      }),

    // Actions
    reply: (sessionId: string, data: { chatId: string; quotedMessageId: string; text: string }) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/reply`, {
        method: "POST", body: JSON.stringify(data),
      }),
    forward: (sessionId: string, data: { fromChatId: string; toChatId: string; messageId: string }) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/forward`, {
        method: "POST", body: JSON.stringify(data),
      }),
    react: (sessionId: string, data: { chatId: string; messageId: string; emoji: string }) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/react`, {
        method: "POST", body: JSON.stringify(data),
      }),
    delete: (sessionId: string, data: { chatId: string; messageId: string; forEveryone?: boolean }) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/delete`, {
        method: "POST", body: JSON.stringify(data),
      }),

    // Bulk
    sendBulk: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/send-bulk`, {
        method: "POST", body: JSON.stringify(data),
      }),
    batchStatus: (sessionId: string, batchId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/batch/${batchId}`),
    cancelBatch: (sessionId: string, batchId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/messages/batch/${batchId}/cancel`, { method: "POST" }),
  },

  // ════════════════════════════════════════════════════════════
  // CHATS
  // ════════════════════════════════════════════════════════════
  chats: {
    list: (sessionId?: string, filter?: { archived?: boolean; pinned?: boolean }) => {
      const q = new URLSearchParams();
      if (sessionId) q.set("sessionId", sessionId);
      if (filter?.archived !== undefined) q.set("archived", String(filter.archived));
      if (filter?.pinned !== undefined) q.set("pinned", String(filter.pinned));
      return apiFetch(`/api/openwa/chats${q.toString() ? `?${q}` : ""}`);
    },
    get: (chatId: string) => apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}`),
    messages: (chatId: string, limit = 50, before?: string) => {
      const q = new URLSearchParams({ limit: String(limit) });
      if (before) q.set("before", before);
      return apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/messages?${q}`);
    },
    sync: (sessionId: string) =>
      apiFetch(`/api/openwa/chats/sessions/${sessionId}/sync`, { method: "POST" }),
    sendSeen: (chatId: string, sessionId: string, messageIds: string[]) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/seen`, {
        method: "POST", body: JSON.stringify({ sessionId, messageIds }),
      }),
    clear: (chatId: string, sessionId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/clear`, {
        method: "POST", body: JSON.stringify({ sessionId }),
      }),
    archive: (chatId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/archive`, { method: "POST" }),
    unarchive: (chatId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/archive`, { method: "DELETE" }),
    pin: (chatId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/pin`, { method: "POST" }),
    unpin: (chatId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/pin`, { method: "DELETE" }),
    mute: (chatId: string, untilMs: number) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/mute`, {
        method: "POST", body: JSON.stringify({ untilMs }),
      }),
    unmute: (chatId: string) =>
      apiFetch(`/api/openwa/chats/${encodeURIComponent(chatId)}/mute`, { method: "DELETE" }),
  },

  // ════════════════════════════════════════════════════════════
  // CONTACTS
  // ════════════════════════════════════════════════════════════
  contacts: {
    list: (sessionId: string) => apiFetch(`/api/openwa/sessions/${sessionId}/contacts`),
    get: (sessionId: string, contactId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}`),
    check: (sessionId: string, number: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/check/${number}`),
    profilePicture: (sessionId: string, contactId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}/profile-picture`),
    block: (sessionId: string, contactId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}/block`, { method: "POST" }),
    unblock: (sessionId: string, contactId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/${encodeURIComponent(contactId)}/block`, { method: "DELETE" }),
    import: (sessionId: string, contacts: any[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/import`, {
        method: "POST", body: JSON.stringify({ contacts }),
      }),
    export: (sessionId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/contacts/export`),
  },

  // ════════════════════════════════════════════════════════════
  // GROUPS
  // ════════════════════════════════════════════════════════════
  groups: {
    list: (sessionId: string) => apiFetch(`/api/openwa/sessions/${sessionId}/groups`),
    get: (sessionId: string, groupId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}`),
    create: (sessionId: string, name: string, participants: string[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups`, {
        method: "POST", body: JSON.stringify({ name, participants }),
      }),
    addParticipants: (sessionId: string, groupId: string, participants: string[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/participants`, {
        method: "POST", body: JSON.stringify({ participants }),
      }),
    removeParticipants: (sessionId: string, groupId: string, participants: string[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/participants`, {
        method: "DELETE", body: JSON.stringify({ participants }),
      }),
    promote: (sessionId: string, groupId: string, participants: string[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/participants/promote`, {
        method: "POST", body: JSON.stringify({ participants }),
      }),
    demote: (sessionId: string, groupId: string, participants: string[]) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/participants/demote`, {
        method: "POST", body: JSON.stringify({ participants }),
      }),
    setSubject: (sessionId: string, groupId: string, subject: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/subject`, {
        method: "PUT", body: JSON.stringify({ subject }),
      }),
    setDescription: (sessionId: string, groupId: string, description: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/description`, {
        method: "PUT", body: JSON.stringify({ description }),
      }),
    leave: (sessionId: string, groupId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/leave`, { method: "POST" }),
    inviteCode: (sessionId: string, groupId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/invite-code`),
    revokeInvite: (sessionId: string, groupId: string) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/groups/${encodeURIComponent(groupId)}/invite-code/revoke`, { method: "POST" }),
  },

  // ════════════════════════════════════════════════════════════
  // WEBHOOKS
  // ════════════════════════════════════════════════════════════
  webhooks: {
    list: (sessionId: string) => apiFetch(`/api/openwa/sessions/${sessionId}/webhooks`),
    create: (sessionId: string, data: any) =>
      apiFetch(`/api/openwa/sessions/${sessionId}/webhooks`, { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiFetch(`/api/openwa/webhooks/${id}`),
    update: (id: string, data: any) =>
      apiFetch(`/api/openwa/webhooks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/openwa/webhooks/${id}`, { method: "DELETE" }),
    test: (id: string) => apiFetch(`/api/openwa/webhooks/${id}/test`, { method: "POST" }),
  },

  // ════════════════════════════════════════════════════════════
  // CAMPAIGNS
  // ════════════════════════════════════════════════════════════
  campaigns: {
    list: (sessionId?: string) =>
      apiFetch(`/api/openwa/campaigns${sessionId ? `?sessionId=${sessionId}` : ""}`),
    create: (data: any) => apiFetch("/api/openwa/campaigns", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiFetch(`/api/openwa/campaigns/${id}`),
    update: (id: string, data: any) =>
      apiFetch(`/api/openwa/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/openwa/campaigns/${id}`, { method: "DELETE" }),
    start: (id: string) => apiFetch(`/api/openwa/campaigns/${id}/start`, { method: "POST" }),
    pause: (id: string) => apiFetch(`/api/openwa/campaigns/${id}/pause`, { method: "POST" }),
    cancel: (id: string) => apiFetch(`/api/openwa/campaigns/${id}/cancel`, { method: "POST" }),
    stats: (id: string) => apiFetch(`/api/openwa/campaigns/${id}/stats`),
  },

  // ════════════════════════════════════════════════════════════
  // TEMPLATES
  // ════════════════════════════════════════════════════════════
  templates: {
    list: () => apiFetch("/api/openwa/templates"),
    create: (data: any) => apiFetch("/api/openwa/templates", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string) => apiFetch(`/api/openwa/templates/${id}`),
    update: (id: string, data: any) =>
      apiFetch(`/api/openwa/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/openwa/templates/${id}`, { method: "DELETE" }),
    send: (id: string, sessionId: string, chatId: string, variables?: Record<string, string>) =>
      apiFetch(`/api/openwa/templates/${id}/send`, {
        method: "POST", body: JSON.stringify({ sessionId, chatId, variables }),
      }),
  },

  // ════════════════════════════════════════════════════════════
  // AUTOMATION
  // ════════════════════════════════════════════════════════════
  automation: {
    listRules: (sessionId?: string) =>
      apiFetch(`/api/openwa/automation/rules${sessionId ? `?sessionId=${sessionId}` : ""}`),
    createRule: (data: any) =>
      apiFetch("/api/openwa/automation/rules", { method: "POST", body: JSON.stringify(data) }),
    getRule: (id: string) => apiFetch(`/api/openwa/automation/rules/${id}`),
    updateRule: (id: string, data: any) =>
      apiFetch(`/api/openwa/automation/rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteRule: (id: string) => apiFetch(`/api/openwa/automation/rules/${id}`, { method: "DELETE" }),
    toggleRule: (id: string) =>
      apiFetch(`/api/openwa/automation/rules/${id}/toggle`, { method: "POST" }),
  },

  // ════════════════════════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════════════════════════
  stats: {
    overview: () => apiFetch("/api/openwa/stats/overview"),
    messages: (period: "24h" | "7d" | "30d" = "24h") =>
      apiFetch(`/api/openwa/stats/messages?period=${period}`),
    session: (sessionId: string) => apiFetch(`/api/openwa/stats/sessions/${sessionId}`),
  },

  // ════════════════════════════════════════════════════════════
  // LABELS
  // ════════════════════════════════════════════════════════════
  labels: {
    list: () => apiFetch("/api/openwa/labels"),
    create: (name: string, color?: string) =>
      apiFetch("/api/openwa/labels", { method: "POST", body: JSON.stringify({ name, color }) }),
    update: (id: string, data: any) =>
      apiFetch(`/api/openwa/labels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/api/openwa/labels/${id}`, { method: "DELETE" }),
  },
};
