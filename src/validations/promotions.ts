import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

import type { SelectOption } from "@/components/pages/Promotions/utils/option-normalizers";
import { thumbnailUrlSchema } from "@/validations/thumbnail-url";

const discountTypeSchema = z.enum(["FLAT", "PERCENTAGE"]);
const applyModeSchema = z.enum(["ORDER_TOTAL", "SCOPED_ITEMS"]);
const orderTypeSchema = z.enum(["DELIVERY", "TAKEAWAY", "DINE_IN"]);

const optionalStringSchema = z.string();
const positiveNumberStringSchema = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((value) => Number(value) > 0, {
      message: getLocalizedMessage("validation029"),
    });

const getDateBoundary = (value: string, boundary: "start" | "end") => {
  const [year, month, day] = value.split("-").map(Number);
  const date =
    year && month && day ? new Date(year, month - 1, day) : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

export const promotionSchema = z
  .object({
    code: optionalStringSchema,
    title: z.string().trim().min(1, getLocalizedMessage("validation073")),
    description: optionalStringSchema,
    audience: z.enum(["GUEST", "REGISTERED", "BOTH"]).default("BOTH"),
    allowedOrderTypes: z
      .array(orderTypeSchema)
      .min(1, getLocalizedMessage("validation090"))
      .default(["DELIVERY", "TAKEAWAY", "DINE_IN"]),
    thumbnailUrl: thumbnailUrlSchema.optional().default(""),
    discountType: discountTypeSchema,
    discountValue: positiveNumberStringSchema("Discount value is required."),
    maxDiscountAmount: optionalStringSchema,
    minOrderAmount: optionalStringSchema,
    maxUses: optionalStringSchema,
    maxUsesPerCustomer: optionalStringSchema,
    startsAt: z.string().min(1, getLocalizedMessage("validation113")),
    expiresAt: optionalStringSchema,
    applyMode: applyModeSchema.default("ORDER_TOTAL"),
    autoApply: z.boolean(),
    isActive: z.boolean(),
    assignPermanently: z.boolean(),
    branchId: optionalStringSchema,
    selectedBranch: z.custom<SelectOption | null>().optional(),
    selectedMenuItems: z.custom<SelectOption[]>().default([]),
    selectedCategories: z.custom<SelectOption[]>().default([]),
  })
  .superRefine((value, ctx) => {
    if (
      value.discountType === "PERCENTAGE" &&
      Number(value.discountValue) > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: getLocalizedMessage("validation081"),
      });
    }

    if (!value.assignPermanently && !value.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: getLocalizedMessage("validation036"),
      });
    }

    if (
      !value.assignPermanently &&
      value.startsAt &&
      value.expiresAt &&
      new Date(value.expiresAt).getTime() <= new Date(value.startsAt).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: getLocalizedMessage("validation037"),
      });
    }
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;

export const happyHourSchema = z
  .object({
    code: optionalStringSchema,
    title: z.string().trim().min(1, getLocalizedMessage("validation043")),
    description: optionalStringSchema,
    audience: z.enum(["REGISTERED", "BOTH"]).default("BOTH"),
    discountType: discountTypeSchema,
    discountValue: positiveNumberStringSchema("Discount value is required."),
    maxDiscountAmount: optionalStringSchema,
    minOrderAmount: optionalStringSchema,
    maxUses: optionalStringSchema,
    maxUsesPerCustomer: optionalStringSchema,
    startsAt: z.string().min(1, getLocalizedMessage("validation113")),
    expiresAt: z.string().min(1, getLocalizedMessage("validation036")),
    isActive: z.boolean(),
    applyMode: applyModeSchema.default("ORDER_TOTAL"),
    activeDays: z
      .array(z.number())
      .min(1, getLocalizedMessage("validation089")),
    dailyStartTime: z.string().min(1, getLocalizedMessage("validation026")),
    dailyEndTime: z.string().min(1, getLocalizedMessage("validation024")),
    selectedMenuItems: z.custom<SelectOption[]>().default([]),
    selectedCategories: z.custom<SelectOption[]>().default([]),
  })
  .superRefine((value, ctx) => {
    if (
      value.discountType === "PERCENTAGE" &&
      Number(value.discountValue) > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: getLocalizedMessage("validation081"),
      });
    }

    const happyHourStart = value.startsAt
      ? getDateBoundary(value.startsAt, "start")
      : null;
    const happyHourEnd = value.expiresAt
      ? getDateBoundary(value.expiresAt, "end")
      : null;

    if (happyHourStart && happyHourEnd && happyHourEnd <= happyHourStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: getLocalizedMessage("validation037"),
      });
    }

    if (
      value.dailyStartTime &&
      value.dailyEndTime &&
      value.dailyEndTime <= value.dailyStartTime
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dailyEndTime"],
        message: getLocalizedMessage("validation025"),
      });
    }
  });

export type HappyHourFormValues = z.infer<typeof happyHourSchema>;

export const couponSchema = z.object({
  code: z.string().trim().min(1, getLocalizedMessage("validation022")),
  title: z.string().trim().min(1, getLocalizedMessage("validation023")),
  discountType: discountTypeSchema,
  discountValue: optionalStringSchema,
  startsAt: optionalStringSchema,
  expiresAt: optionalStringSchema,
  description: optionalStringSchema,
  audience: z.enum(["REGISTERED", "BOTH"]).default("BOTH"),
  applyMode: applyModeSchema.default("ORDER_TOTAL"),
  branchId: optionalStringSchema,
  maxDiscountAmount: optionalStringSchema,
  minOrderAmount: optionalStringSchema,
  maxUses: optionalStringSchema,
  maxUsesPerCustomer: optionalStringSchema,
  selectedMenuItems: z.custom<SelectOption[]>().default([]),
  selectedCategories: z.custom<SelectOption[]>().default([]),
});

export type CouponFormValues = z.infer<typeof couponSchema>;
