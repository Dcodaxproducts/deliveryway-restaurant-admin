import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number is too long");

const customerBaseSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: phoneSchema,
});

export const createCustomerSchema = customerBaseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  restaurantId: z.string().min(1, "Restaurant is required"),
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
  emails: z.array(z.string().trim().email("Invalid email")).min(1, "At least one email is required"),
});

export type ForceDeleteCustomerValues = z.infer<typeof forceDeleteCustomerSchema>;

export const customerListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  withDeleted: z.boolean().optional(),
  includeInactive: z.boolean().optional(),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
});

export type CustomerListParams = z.infer<typeof customerListParamsSchema>;

export const verifyCustomerOtpSchema = z.object({
  otp: z.string().trim().min(1, "OTP is required").min(4, "OTP is too short").max(10, "OTP is too long"),
});

export type VerifyCustomerOtpValues = z.infer<typeof verifyCustomerOtpSchema>;
