import { z } from "zod";

/**
 * ==============================
 * Staff Role Schema
 * ==============================
 */

const permissionSchema = z.object({
  access: z.string().min(1, "Access is required"),
  operations: z
    .array(z.string().min(1))
    .min(1, "At least one operation is required"),
});

export const staffRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  permissions: z
    .array(permissionSchema)
    .min(1, "At least one permission is required"),
  description: z.string().max(300).optional(),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
});

export type StaffRoleValues = z.infer<typeof staffRoleSchema>;

/**
 * ==============================
 * Staff Schema
 * ==============================
 */

export const staffSchema = z.object({
  email: z.string().email("Invalid email"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),

  staffRoleId: z.string().min(1, "Staff role is required"),

  phone: z
    .string()
    .min(10, "Invalid phone number")
    .optional(),

  // avatarUrl: z
  //   .string()
  //   .url("Invalid avatar URL")
  //   .optional(),

  bio: z
    .string()
    .max(500, "Bio must be under 500 characters")
    .optional(),

  isActive: z.boolean().default(true),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
});

export type StaffValues = z.infer<typeof staffSchema>;