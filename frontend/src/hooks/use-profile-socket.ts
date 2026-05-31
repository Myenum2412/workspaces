"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api/config";
import { queryKeys } from "@/lib/query/keys";

export function useProfileSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("profile_updated", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profileHistory(1) });
    });

    socket.on("avatar_updated", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      // Broadcast to any component listening for avatar changes
      window.dispatchEvent(new CustomEvent("avatar_updated_global"));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
