"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api/config";

export function useWhatsappSocket(
  organizationId: string | undefined,
  onConnectionUpdate?: (data: any) => void,
  onNewMessage?: (data: any) => void
) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!organizationId || socketRef.current?.connected) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[WA Socket] Connected");
      socket.emit("whatsapp:subscribe", organizationId);
    });

    socket.on("disconnect", () => {
      console.log("[WA Socket] Disconnected");
    });

    socket.on("whatsapp:connection_update", (data: any) => {
      if (data.organizationId === organizationId) {
        onConnectionUpdate?.(data);
      }
    });

    socket.on("whatsapp:new_message", (data: any) => {
      if (data.organizationId === organizationId) {
        onNewMessage?.(data);
      }
    });

    socketRef.current = socket;
  }, [organizationId, onConnectionUpdate, onNewMessage]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
  };
}
