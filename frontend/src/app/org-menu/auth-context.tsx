"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthSession } from "@/types/shared";

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function useOrgAuth() {
  return useContext(AuthContext);
}
