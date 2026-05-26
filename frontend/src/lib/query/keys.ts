export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  users: () => ["users"] as const,
  payments: () => ["payments"] as const,
  tasks: () => ["tasks"] as const,
};
