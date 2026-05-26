import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional().default(""),
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  email: z.string().trim().email("Invalid email").max(255).transform((v) => v.toLowerCase()),
  category: z.string().trim().max(100).optional().default("Other"),
  companyRange: z.string().trim().max(50).optional().default("1-10"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email").transform((v) => v.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email").transform((v) => v.toLowerCase()),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});
