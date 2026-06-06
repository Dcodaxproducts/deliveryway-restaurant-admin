import { z } from "zod";
import { validationMessages } from "@/lib/validation";

export const deliveryPolygonPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const deliveryZoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, validationMessages.required),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0),
  polygon: z.array(deliveryPolygonPointSchema),
});

export const zoneBandSchema = z.object({
  id: z.string().optional(),
  fromKm: z.coerce.number().min(0),
  toKm: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0),
});

export const postalCodeRuleSchema = z.object({
  id: z.string().optional(),
  postalCode: z.string().trim().min(1, validationMessages.required),
  deliveryFee: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0),
});

export const serviceChargeSchema = z
  .object({
    isEnabled: z.boolean(),
    type: z.enum(["PERCENTAGE", "AMOUNT"]).default("PERCENTAGE"),
    value: z.coerce.number().min(0),
  })
  .superRefine((serviceCharge, ctx) => {
    if (!serviceCharge.isEnabled) return;

    if (serviceCharge.value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Service charge value must be greater than 0 when enabled",
        path: ["value"],
      });
      return;
    }

    if (serviceCharge.type === "PERCENTAGE" && serviceCharge.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage service charge cannot exceed 100",
        path: ["value"],
      });
    }
  });

export const deliveryConfigSchema = z.object({
  mode: z.enum(["RADIUS", "ZONE", "ZONE_BANDS", "POSTAL_CODE"]),
  radiusKm: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0),
  isFreeDelivery: z.boolean(),
  freeDeliveryThreshold: z.coerce.number().min(0),
  zones: z.array(deliveryZoneSchema),
  zoneBands: z.array(zoneBandSchema),
  postalCodeRules: z.array(postalCodeRuleSchema),
}).superRefine((deliveryConfig, ctx) => {
  if (deliveryConfig.mode !== "POSTAL_CODE") return;

  if (!deliveryConfig.postalCodeRules.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please add at least one postal code delivery rule",
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

const optionalTrimmedStringSchema = z.string().trim().optional();

const optionalEditEmailSchema = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? undefined : value),
  z.string().trim().email(validationMessages.email).optional()
);

const optionalEditPasswordSchema = z
  .string()
  .optional()
  .superRefine((password, ctx) => {
    const trimmedPassword = password?.trim() ?? "";

    if (!trimmedPassword || trimmedPassword.length >= 8) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: validationMessages.passwordMin,
    });
  });

export const editBranchAdminSchema = z.object({
  email: optionalEditEmailSchema,
  firstName: optionalTrimmedStringSchema,
  lastName: optionalTrimmedStringSchema,
  phone: optionalTrimmedStringSchema,
  password: optionalEditPasswordSchema,
});

export const editBranchSchema = z.object({
  name: z.string().trim().min(1, validationMessages.required),
  description: z.string().optional(),
  isMain: z.boolean().optional(),
  restaurantId: z.string().optional(),
  branchAdmin: editBranchAdminSchema.optional(),
  address: z
    .object({
      street: z.string().optional(),
      area: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      lat: z.unknown().optional(),
      lng: z.unknown().optional(),
    })
    .optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type EditBranchValues = z.infer<typeof editBranchSchema>;
export type DeliveryConfigValues = z.infer<typeof deliveryConfigSchema>;
export type ServiceChargeValues = z.infer<typeof serviceChargeSchema>;
