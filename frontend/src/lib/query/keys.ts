export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  users: () => ["users"] as const,
  payments: () => ["payments"] as const,
  tasks: () => ["tasks"] as const,

  // Profile
  profile: () => ["profile"] as const,
  profileHistory: (page: number) => ["profile", "history", page] as const,
  profileActivity: () => ["profile", "activity"] as const,
  adminUsers: (filters: Record<string, unknown>) => ["admin", "users", filters] as const,
};
