import { create } from "zustand";

interface WorkspaceState {
  activeWorkspaceId: string | null;
  filters: Record<string, Record<string, unknown>>;
}

interface WorkspaceActions {
  setActiveWorkspace: (id: string | null) => void;
  setFilter: (domain: string, key: string, value: unknown) => void;
  getFilter: (domain: string, key: string) => unknown;
  resetFilters: (domain?: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()((set, get) => ({
  activeWorkspaceId: null,
  filters: {},

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  setFilter: (domain, key, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [domain]: {
          ...(s.filters[domain] ?? {}),
          [key]: value,
        },
      },
    })),

  getFilter: (domain, key) => {
    return get().filters[domain]?.[key];
  },

  resetFilters: (domain) =>
    domain
      ? set((s) => {
          const next = { ...s.filters };
          delete next[domain];
          return { filters: next };
        })
      : set({ filters: {} }),
}));
