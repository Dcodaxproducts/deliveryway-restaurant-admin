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
  mode: z.string().optional().default("RADIUS"),
  radiusKm: z.coerce.number().min(0).optional().default(0),
  minOrderAmount: z.coerce.number().min(0).optional().default(0),
  deliveryFee: z.coerce.number().min(0).optional().default(0),
  isFreeDelivery: z.boolean().optional().default(false),
  freeDeliveryThreshold: z.coerce.number().min(0).optional().default(0),
  zones: z.array(z.unknown()).optional().default([]),
  zoneBands: z.array(z.unknown()).optional().default([]),
  postalCodeRules: z
    .array(
      z.object({
        postalCode: z.string().trim().min(1, "Postal code is required"),
        deliveryFee: z.coerce.number().min(0),
        minOrderAmount: z.coerce.number().min(0),
        freeDeliveryThreshold: z.coerce.number().min(0),
      })
    )
    .optional()
    .default([]),
}).superRefine((deliveryConfig, ctx) => {
  if (deliveryConfig.mode !== "POSTAL_CODE") return;

  if (!deliveryConfig.postalCodeRules.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one postal code rule is required",
      path: ["postalCodeRules"],
    });
    return;
  }

  const seenPostalCodes = new Set<string>();

  deliveryConfig.postalCodeRules.forEach((rule, index) => {
    const postalCode = rule.postalCode.trim().toLowerCase();

    if (seenPostalCodes.has(postalCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate postal codes are not allowed",
        path: ["postalCodeRules", index, "postalCode"],
      });
      return;
    }

    seenPostalCodes.add(postalCode);
  });
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

const BranchSettingsBaseSchema = z.object({
  allowedOrderTypes: z.array(OrderTypeEnum),
  allowedPaymentMethods: z.array(PaymentMethodEnum),
  deliveryConfig: DeliveryConfigSchema,
  automation: AutomationSchema,
  taxation: TaxationSchema,
  tableReservationsEnabled: z.boolean(),
  tableReservationAutoAccept: z.boolean().optional().default(false),
  tableCount: z.coerce.number().int().min(0).optional().default(0),
  contact: ContactSchema,
});

export const BranchSettingsSchema = BranchSettingsBaseSchema.superRefine((settings, ctx) => {
  if (!settings.tableReservationsEnabled || settings.tableCount >= 1) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Table count must be at least 1 when table reservations are enabled",
    path: ["tableCount"],
  });
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
  settings: BranchSettingsBaseSchema.partial().superRefine((settings, ctx) => {
    if (!settings.tableReservationsEnabled) return;

    const tableCount = Number(settings.tableCount ?? 0);
    if (Number.isInteger(tableCount) && tableCount >= 1) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Table count must be at least 1 when table reservations are enabled",
      path: ["tableCount"],
    });
  }).optional(),
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
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  breakTimes: z
    .array(
      z.object({
        startTime: z.string(),
        endTime: z.string(),
        note: z.string().optional(),
      })
    )
    .optional(),
  note: z.string().optional(),
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
