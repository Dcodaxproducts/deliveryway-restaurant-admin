import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

const permissionSchema = z.object({
  access: z.string().min(1, getLocalizedMessage("validation001")),
  operations: z.array(z.string().min(1)).min(1, getLocalizedMessage("validation009")),
});

export const staffRoleSchema = z.object({
  name: z.string().min(2, getLocalizedMessage("validation101")),
  permissions: z.array(permissionSchema).min(1, getLocalizedMessage("validation010")),
  description: z.string().max(300).optional(),
});

export type StaffRoleValues = z.infer<typeof staffRoleSchema>;
export type StaffPermissionValues = z.infer<typeof permissionSchema>;

export const staffSchema = z.object({
  email: z.string().email(getLocalizedMessage("validation048")),
  password: z.string().min(8, getLocalizedMessage("validation080")),
  firstName: z.string().min(1, getLocalizedMessage("validation039")),
  lastName: z.string().min(1, getLocalizedMessage("validation060")),
  staffRoleId: z.string().min(1, getLocalizedMessage("validation112")),
  phone: z.string().min(10, getLocalizedMessage("validation052")).optional(),
  bio: z.string().max(500, getLocalizedMessage("validation013")).optional(),
  isActive: z.boolean().default(true),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
  restaurantIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  allRestaurants: z.boolean().optional(),
  hasAllRestaurantsAccess: z.boolean().optional(),
});

export type StaffValues = z.infer<typeof staffSchema>;

export const staffModalSchema = staffSchema.omit({ restaurantId: true, branchId: true }).extend({
  password: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type StaffModalValues = z.infer<typeof staffModalSchema>;
