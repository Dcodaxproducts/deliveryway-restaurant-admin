import { z } from "zod";

import type { SelectOption } from "@/components/pages/Promotions/utils/option-normalizers";
import { thumbnailUrlSchema } from "@/validations/thumbnail-url";

const discountTypeSchema = z.enum(["FLAT", "PERCENTAGE"]);
const applyModeSchema = z.enum(["ORDER_TOTAL", "SCOPED_ITEMS"]);

const optionalStringSchema = z.string();
const positiveNumberStringSchema = (message: string) =>
  z.string().min(1, message).refine((value) => Number(value) > 0, {
    message: "Discount value must be greater than 0.",
  });

export const promotionSchema = z
  .object({
    code: optionalStringSchema,
    title: z.string().trim().min(1, "Offer title is required."),
    description: optionalStringSchema,
    thumbnailUrl: thumbnailUrlSchema.optional().default(""),
    discountType: discountTypeSchema,
    discountValue: positiveNumberStringSchema("Discount value is required."),
    maxDiscountAmount: optionalStringSchema,
    minOrderAmount: optionalStringSchema,
    maxUses: optionalStringSchema,
    maxUsesPerCustomer: optionalStringSchema,
    startsAt: z.string().min(1, "Start date is required."),
    expiresAt: optionalStringSchema,
    applyMode: applyModeSchema,
    autoApply: z.boolean(),
    isActive: z.boolean(),
    assignPermanently: z.boolean(),
    branchId: optionalStringSchema,
    selectedBranch: z.custom<SelectOption | null>().optional(),
    selectedMenuItems: z.custom<SelectOption[]>(),
    selectedCategories: z.custom<SelectOption[]>(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENTAGE" && Number(value.discountValue) > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage discount cannot be greater than 100.",
      });
    }

    if (!value.assignPermanently && !value.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "Expiry date is required.",
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
        message: "Expiry date must be after start date.",
      });
    }
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;

export const happyHourSchema = z
  .object({
    code: optionalStringSchema,
    title: z.string().trim().min(1, "Happy hour title is required."),
    description: optionalStringSchema,
    discountType: discountTypeSchema,
    discountValue: positiveNumberStringSchema("Discount value is required."),
    maxDiscountAmount: optionalStringSchema,
    minOrderAmount: optionalStringSchema,
    maxUses: optionalStringSchema,
    maxUsesPerCustomer: optionalStringSchema,
    startsAt: z.string().min(1, "Start date is required."),
    expiresAt: z.string().min(1, "Expiry date is required."),
    isActive: z.boolean(),
    activeDays: z.array(z.number()).min(1, "Please select at least one active day."),
    dailyStartTime: z.string().min(1, "Daily start time is required."),
    dailyEndTime: z.string().min(1, "Daily end time is required."),
    selectedMenuItem: z.custom<SelectOption | null>().optional(),
    selectedCategory: z.custom<SelectOption | null>().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENTAGE" && Number(value.discountValue) > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Percentage discount cannot be greater than 100.",
      });
    }

    if (
      value.startsAt &&
      value.expiresAt &&
      new Date(value.expiresAt).getTime() <= new Date(value.startsAt).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiresAt"],
        message: "Expiry date must be after start date.",
      });
    }

    if (value.dailyStartTime && value.dailyEndTime && value.dailyEndTime <= value.dailyStartTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dailyEndTime"],
        message: "Daily end time must be after daily start time.",
      });
    }
  });

export type HappyHourFormValues = z.infer<typeof happyHourSchema>;

export const couponSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required."),
  title: z.string().trim().min(1, "Coupon title is required."),
  discountType: discountTypeSchema,
  discountValue: optionalStringSchema,
  startsAt: optionalStringSchema,
  expiresAt: optionalStringSchema,
  description: optionalStringSchema,
  branchId: optionalStringSchema,
  maxDiscountAmount: optionalStringSchema,
  minOrderAmount: optionalStringSchema,
  maxUses: optionalStringSchema,
  maxUsesPerCustomer: optionalStringSchema,
  scopeMenuItemId: optionalStringSchema,
  scopeCategoryId: optionalStringSchema,
});

export type CouponFormValues = z.infer<typeof couponSchema>;
