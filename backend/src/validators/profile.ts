import { z } from "zod";

const addressSchema = z.object({
  street: z.string().trim().max(500).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  country: z.string().trim().max(100).optional().default(""),
  postalCode: z.string().trim().max(20).optional().default(""),
}).optional();

/**
 * Self-profile update — user editing their own profile.
 * All fields optional; only provided fields are updated.
 */
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  designation: z.string().trim().max(200).optional(),
  department: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(2000).optional(),
  expertise: z.array(z.string().trim().max(100)).max(20).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  personalEmail: z.string().trim().email("Invalid email").max(255).optional(),
  personalPhone: z.string().trim().max(20).optional(),
  dob: z.string().trim().max(50).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  maritalStatus: z.string().trim().max(50).optional(),
  address: addressSchema,
  permanentAddress: z.string().trim().max(500).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Admin profile update — admins can also set role, status, verification flags.
 */
export const adminUpdateProfileSchema = updateProfileSchema.extend({
  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  accountVerified: z.boolean().optional(),
  email: z.string().trim().email("Invalid email").max(255).optional(),
});

/**
 * Admin user list query params.
 */
export const profileQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  sortBy: z.enum(["firstName", "lastName", "email", "lastLogin", "createdAt", "profileCompletion"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Pagination for history/activity endpoints.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Admin status update.
 */
export const adminStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  reason: z.string().trim().max(500).optional(),
});
