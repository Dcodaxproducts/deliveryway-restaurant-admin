import { z } from "zod";

/**
 * ==============================
 * ENUMS
 * ==============================
 */

export const OrderTypeEnum = z.enum([
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
]);

export const PaymentMethodEnum = z.enum([
  "COD",
  "BANK_TRANSFER",
  "JAZZCASH",
  "EASYPAISA",
]);

export const DayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

/**
 * ==============================
 * NESTED SCHEMAS
 * ==============================
 */

export const BranchAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(8),
});

export const DeliveryConfigSchema = z.object({
  radiusKm: z.number(),
  minOrderAmount: z.number(),
  deliveryFee: z.number(),
  isFreeDelivery: z.boolean(),
  freeDeliveryThreshold: z.number(),
});

export const AutomationSchema = z.object({
  autoAcceptOrders: z.boolean(),
  estimatedPrepTime: z.number(),
});

export const TaxationSchema = z.object({
  taxPercentage: z.number(),
});

export const ContactSchema = z.object({
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
});

export const BranchSettingsSchema = z.object({
  allowedOrderTypes: z.array(OrderTypeEnum),
  allowedPaymentMethods: z.array(PaymentMethodEnum),
  deliveryConfig: DeliveryConfigSchema,
  automation: AutomationSchema,
  taxation: TaxationSchema,
  tableReservationsEnabled: z.boolean(),
  contact: ContactSchema,
});

/**
 * ==============================
 * MAIN BRANCH SCHEMA
 * ==============================
 */

export const BranchSchema = z.object({
  restaurantId: z.string(),
  name: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  lat: z.string(),
  lng: z.string(),
  isMain: z.boolean(),
  area: z.string().optional(),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  branchAdmin: BranchAdminSchema.optional(),
  settings: BranchSettingsSchema.optional(),
});

export const createBranchSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().trim().min(1, "Branch name is required"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  area: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  isMain: z.boolean(),
  branchAdmin: z.object({
    email: z.string().optional(),
    password: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
});

/**
 * ==============================
 * BULK SCHEMA
 * ==============================
 */
export const BulkBranchSchema = z.object({
  restaurantId: z.string(),
  branches: z.array(
    BranchSchema.omit({ restaurantId: true })
  ),
});

/**
 * ==============================
 * OPENING HOURS
 * ==============================
 */

export const OpeningHoursSchema = z.object({
  dayOfWeek: DayOfWeekEnum,
  isClosed: z.boolean(),
  openTime: z.any().optional(),
  closeTime: z.any().optional(),
  note: z.any().optional(),
});

export const UpdateOpeningHoursSchema = z.object({
  openingHours: z.array(OpeningHoursSchema),
});

/**
 * ==============================
 * TYPES
 * ==============================
 */

export type BranchValues = z.infer<typeof BranchSchema>;
export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;
export type BulkBranchValues = z.infer<typeof BulkBranchSchema>;
export type OpeningHoursValues = z.infer<typeof UpdateOpeningHoursSchema>;
