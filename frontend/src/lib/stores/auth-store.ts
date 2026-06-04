import { create } from "zustand";
import type { UserProfile, Organization, RoleName } from "@/types";
import { ROLE_HIERARCHY } from "@/types";

interface AuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    role: RoleName;
    organizationId?: string;
    workspaceId?: string | null;
  } | null;
  organization: Organization | null;
  membership: {
    role: RoleName;
    organizationId: string;
    workspaceId?: string | null;
  } | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (params: {
    user: AuthState["user"];
    organization: Organization | null;
    membership: AuthState["membership"];
  }) => void;
  setUser: (user: AuthState["user"]) => void;
  setOrganization: (org: Organization | null) => void;
  clearAuth: () => void;
  hasRole: (minRole: RoleName) => boolean;
  canManage: (targetRole: RoleName) => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  (set, get) => ({
    user: null,
    organization: null,
    membership: null,
    isAuthenticated: false,

    setAuth: ({ user, organization, membership }) => {
      set({
        user,
        organization,
        membership,
        isAuthenticated: !!user,
      });
    },

    setUser: (user) => {
      set({ user, isAuthenticated: !!user });
    },

    setOrganization: (organization) => {
      set({ organization });
    },

    clearAuth: () => {
      set({
        user: null,
        organization: null,
        membership: null,
        isAuthenticated: false,
      });
    },

    hasRole: (minRole: RoleName) => {
      const { membership } = get();
      if (!membership) return false;
      return (ROLE_HIERARCHY[membership.role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
    },

    canManage: (targetRole: RoleName) => {
      const { membership } = get();
      if (!membership) return false;
      return (ROLE_HIERARCHY[membership.role] ?? 0) > (ROLE_HIERARCHY[targetRole] ?? 0);
    },
  }),
);

// Selectors for performance
export const selectUser = (state: AuthState & AuthActions) => state.user;
export const selectOrganization = (state: AuthState & AuthActions) => state.organization;
export const selectMembership = (state: AuthState & AuthActions) => state.membership;
export const selectIsAuthenticated = (state: AuthState & AuthActions) => state.isAuthenticated;
export const selectUserRole = (state: AuthState & AuthActions) => state.membership?.role ?? "MEMBER";
