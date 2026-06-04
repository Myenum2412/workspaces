import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).default(""),
  role: z.enum(["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"]).default("MEMBER"),
  workspaceId: z.string().uuid().optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  phone: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(["ORG_ADMIN", "WORKSPACE_MANAGER", "MEMBER"]),
  workspaceId: z.string().uuid().optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.string().max(50).optional(),
  role: z.string().max(50).optional(),
  sortBy: z.string().max(50).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const bulkActionSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["activate", "deactivate", "suspend", "delete"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
