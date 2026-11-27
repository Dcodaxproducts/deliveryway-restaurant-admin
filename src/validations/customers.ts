import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(10, getLocalizedMessage("validation085"))
  .max(20, getLocalizedMessage("validation084"));

const customerBaseSchema = z.object({
  email: z.string().trim().email(getLocalizedMessage("validation049")),
  firstName: z.string().trim().min(1, getLocalizedMessage("validation039")),
  lastName: z.string().trim().min(1, getLocalizedMessage("validation060")),
  phone: phoneSchema,
});

export const createCustomerSchema = customerBaseSchema.extend({
  password: z.string().min(8, getLocalizedMessage("validation080")),
  restaurantId: z.string().min(1, getLocalizedMessage("validation097")),
});

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>;

export const customerModalSchema = customerBaseSchema.extend({
  password: z.string().optional(),
});

export type CustomerModalValues = z.infer<typeof customerModalSchema>;

export const updateCustomerSchema = customerBaseSchema;

export type UpdateCustomerValues = z.infer<typeof updateCustomerSchema>;

export const customerStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CustomerStatusValues = z.infer<typeof customerStatusSchema>;

export const forceDeleteCustomerSchema = z.object({
  emails: z
    .array(z.string().trim().email(getLocalizedMessage("validation048")))
    .min(1, getLocalizedMessage("validation006")),
});

export type ForceDeleteCustomerValues = z.infer<
  typeof forceDeleteCustomerSchema
>;

export const customerListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  withDeleted: z.boolean().optional(),
  includeInactive: z.boolean().optional(),
  isGuest: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  fromDate: z.string().date().optional(),
  toDate: z.string().date().optional(),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
});

export type CustomerListParams = z.infer<typeof customerListParamsSchema>;

export const verifyCustomerOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, getLocalizedMessage("validation076"))
    .min(4, getLocalizedMessage("validation078"))
    .max(10, getLocalizedMessage("validation077")),
});

export type VerifyCustomerOtpValues = z.infer<typeof verifyCustomerOtpSchema>;
