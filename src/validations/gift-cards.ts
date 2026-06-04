import { z } from "zod";

import { fromDateTimeLocalValue } from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";
import type {
  GiftCardCreatePayload,
  GiftCardFormValues,
  GiftCardUpdatePayload,
} from "@/types/gift-cards";
import {
  getOptionalThumbnailUrl,
  thumbnailUrlSchema,
} from "@/validations/thumbnail-url";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalPositiveInteger = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  },
  z.number().int().min(1).nullable().optional()
);

const optionalImageUrlSchema = thumbnailUrlSchema.optional().default("");

export const giftCardFormSchema = z
  .object({
    restaurantId: optionalText,
    branchId: optionalText,
    code: optionalText,
    title: z.string().trim().min(1, "Title is required."),
    description: optionalText,
    imageUrl: optionalImageUrlSchema,
    thumbnailUrl: optionalImageUrlSchema,
    amount: z.preprocess(
      (value) => Number(value),
      z.number().positive("Amount must be greater than 0.")
    ),
    maxUses: optionalPositiveInteger,
    maxUsesPerCustomer: optionalPositiveInteger,
    startsAt: z.string().trim().min(1, "Starts At is required."),
    expiresAt: z.string().trim().min(1, "Expires At is required."),
    isActive: z.boolean().default(true),
  })
  .superRefine((values, context) => {
    const startsAt = new Date(values.startsAt);
    const expiresAt = new Date(values.expiresAt);

    if (
      !Number.isNaN(startsAt.getTime()) &&
      !Number.isNaN(expiresAt.getTime()) &&
      expiresAt <= startsAt
    ) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expires At must be after Starts At.",
      });
    }
  });

const getTrimmedUrl = (value: string | null | undefined) => {
  return getOptionalThumbnailUrl(value);
};

const setImageAliases = (payload: GiftCardCreatePayload, values: GiftCardFormValues) => {
  const imageUrl = getTrimmedUrl(values.imageUrl);
  const thumbnailUrl = getTrimmedUrl(values.thumbnailUrl);
  const sharedUrl = imageUrl || thumbnailUrl;

  if (!sharedUrl) return;

  payload.imageUrl = imageUrl || sharedUrl;
  payload.thumbnailUrl = thumbnailUrl || sharedUrl;
};

const buildBasePayload = (values: GiftCardFormValues): GiftCardCreatePayload => {
  const payload: GiftCardCreatePayload = {
    title: values.title.trim(),
    amount: values.amount,
    startsAt: fromDateTimeLocalValue(values.startsAt),
    expiresAt: fromDateTimeLocalValue(values.expiresAt),
    isActive: values.isActive,
  };

  if (values.restaurantId?.trim()) payload.restaurantId = values.restaurantId.trim();
  if (values.branchId?.trim()) payload.branchId = values.branchId.trim();
  if (values.code?.trim()) payload.code = values.code.trim().toUpperCase();
  if (values.description?.trim()) payload.description = values.description.trim();
  if (typeof values.maxUses === "number") payload.maxUses = values.maxUses;
  if (typeof values.maxUsesPerCustomer === "number") {
    payload.maxUsesPerCustomer = values.maxUsesPerCustomer;
  }

  setImageAliases(payload, values);

  return payload;
};

export const buildGiftCardCreatePayload = (
  values: GiftCardFormValues
): GiftCardCreatePayload => buildBasePayload(values);

export const buildGiftCardUpdatePayload = (
  values: GiftCardFormValues
): GiftCardUpdatePayload => buildBasePayload(values);

export type GiftCardValidatedFormValues = z.infer<typeof giftCardFormSchema>;
