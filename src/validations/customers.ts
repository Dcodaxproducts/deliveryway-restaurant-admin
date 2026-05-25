import { z } from "zod";

/**
 * ==============================
 * Shared / Base Schemas
 * ==============================
 */

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

/**
 * ==============================
 * Create Customer Schema
 * ==============================
 * Used for:
 * POST /auth/register-customer
 */
export const createCustomerSchema = customerBaseSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  restaurantId: z.string().min(1, "Restaurant is required"),
});

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>;

/**
 * ==============================
 * Update Customer Schema
 * ==============================
 * Used for:
 * PATCH /admin/users/customers/{id}
 *
 * Password is intentionally excluded because
 * your current update flow does not send it.
 */
export const updateCustomerSchema = customerBaseSchema;

export type UpdateCustomerValues = z.infer<typeof updateCustomerSchema>;

/**
 * ==============================
 * Customer Status Schema
 * ==============================
 * Used for:
 * PATCH /admin/users/customers/{id}/status
 *
 * Your backend may accept either:
 * - isActive: boolean
 * or
 * - blocked: boolean
 *
 * Based on your current data shape, isActive is the safer choice.
 */
export const customerStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CustomerStatusValues = z.infer<typeof customerStatusSchema>;

/**
 * ==============================
 * Force Delete Schema
 * ==============================
 * Used for:
 * POST /admin/users/force-delete
 */
export const forceDeleteCustomerSchema = z.object({
  emails: z
    .array(z.string().trim().email("Invalid email"))
    .min(1, "At least one email is required"),
});

export type ForceDeleteCustomerValues = z.infer<
  typeof forceDeleteCustomerSchema
>;

/**
 * ==============================
 * Customer List Query Schema
 * ==============================
 * Used for:
 * GET /admin/users/customers
 *
 * /admin/users/customers?search=string&sortOrder=DESC&withDeleted=false&includeInactive=false&restaurantId=string
 */
export const customerListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  withDeleted: z.boolean().optional(),
  includeInactive: z.boolean().optional(),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
});

export type CustomerListParams = z.infer<typeof customerListParamsSchema>;

/**
 * ==============================
 * OTP Verify Schema
 * ==============================
 * Optional helper if you want to validate OTP form too
 */
export const verifyCustomerOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .min(1, "OTP is required")
    .min(4, "OTP is too short")
    .max(10, "OTP is too long"),
});

export type VerifyCustomerOtpValues = z.infer<
  typeof verifyCustomerOtpSchema
>;