import { z } from "zod";

import { fromDateTimeLocalValue } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import type {
  AdminDealCreatePayload,
  AdminDealFormValues,
  AdminDealUpdatePayload,
} from "@/types/admin-deals";
import {
  getOptionalThumbnailUrl,
  thumbnailUrlSchema,
} from "@/validations/thumbnail-url";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const requiredQuantitySchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  },
  z.number().int().min(1).nullable().optional()
);

const optionalImageUrlSchema = thumbnailUrlSchema.optional().default("");

const getTrimmedUrl = (value: string | null | undefined) => {
  return getOptionalThumbnailUrl(value);
};

const optionalDateTimeLocalSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const getDateFromOptionalDateTime = (value: string | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const adminDealFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    description: optionalText,
    restaurantId: optionalText,
    branchId: optionalText,
    thumbnailUrl: optionalImageUrlSchema,
    imageUrl: optionalImageUrlSchema,
    discountValue: z.preprocess(
      (value) => Number(value),
      z.number().positive("Fixed Deal Price must be greater than 0.")
    ),
    startsAt: optionalDateTimeLocalSchema,
    expiresAt: optionalDateTimeLocalSchema,
    dealSelectionMode: z.enum(["FIXED_ITEMS", "FLEXIBLE_ITEMS"]),
    dealSourceType: z.enum(["ITEMS", "CATEGORIES"]),
    dealRequiredQuantity: requiredQuantitySchema,
    scopeMenuItemIds: z.array(z.string()).default([]),
    scopeCategoryIds: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
  })
  .superRefine((values, context) => {
    const startsAt = getDateFromOptionalDateTime(values.startsAt);
    const expiresAt = getDateFromOptionalDateTime(values.expiresAt);

    if (values.startsAt && !startsAt) {
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Starts At must be a valid date and time.",
      });
    }

    if (values.expiresAt && !expiresAt) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expires At must be a valid date and time.",
      });
    }

    if (startsAt && expiresAt && expiresAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expires At must be after Starts At.",
      });
    }

    if (values.dealSelectionMode === "FIXED_ITEMS") {
      if (values.dealSourceType !== "ITEMS") {
        context.addIssue({
          code: "custom",
          path: ["dealSourceType"],
          message: "Fixed item deals must use selected menu items.",
        });
      }

      if (values.scopeMenuItemIds.length < 2) {
        context.addIssue({
          code: "custom",
          path: ["scopeMenuItemIds"],
          message: "Select at least 2 menu items for a fixed item deal.",
        });
      }

      if (values.scopeCategoryIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["scopeCategoryIds"],
          message: "Categories are only available for flexible deals.",
        });
      }

      return;
    }

    if (!values.dealRequiredQuantity) {
      context.addIssue({
        code: "custom",
        path: ["dealRequiredQuantity"],
        message: "Required quantity is required for flexible deals.",
      });
    }

    if (values.dealSourceType === "ITEMS") {
      if (
        values.dealRequiredQuantity &&
        values.scopeMenuItemIds.length < values.dealRequiredQuantity
      ) {
        context.addIssue({
          code: "custom",
          path: ["scopeMenuItemIds"],
          message: "Selected menu items must be at least the required quantity.",
        });
      }

      if (values.scopeCategoryIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["scopeCategoryIds"],
          message: "Category scope must be empty for item-based deals.",
        });
      }

      return;
    }

    if (values.scopeCategoryIds.length < 1) {
      context.addIssue({
        code: "custom",
        path: ["scopeCategoryIds"],
        message: "Select at least 1 category for a flexible category deal.",
      });
    }

    if (values.scopeMenuItemIds.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["scopeMenuItemIds"],
        message: "Menu item scope must be empty for category-based deals.",
      });
    }
  });

const buildBasePayload = (values: AdminDealFormValues): AdminDealCreatePayload => {
  const payload: AdminDealCreatePayload = {
    title: values.title.trim(),
    discountValue: values.discountValue,
    dealSelectionMode: values.dealSelectionMode,
    isActive: values.isActive,
  };

  const startsAt = fromDateTimeLocalValue(values.startsAt);
  const expiresAt = fromDateTimeLocalValue(values.expiresAt);
  if (startsAt) payload.startsAt = startsAt;
  if (expiresAt) payload.expiresAt = expiresAt;

  if (values.description?.trim()) payload.description = values.description.trim();
  if (values.restaurantId?.trim()) payload.restaurantId = values.restaurantId.trim();
  if (values.branchId?.trim()) payload.branchId = values.branchId.trim();

  const thumbnailUrl = getTrimmedUrl(values.thumbnailUrl);
  if (thumbnailUrl) payload.thumbnailUrl = thumbnailUrl;

  const imageUrl = getTrimmedUrl(values.imageUrl);
  if (imageUrl) payload.imageUrl = imageUrl;

  if (values.dealSelectionMode === "FIXED_ITEMS") {
    payload.scopeMenuItemIds = values.scopeMenuItemIds;
    return payload;
  }

  if (typeof values.dealRequiredQuantity === "number") {
    payload.dealRequiredQuantity = values.dealRequiredQuantity;
  }

  if (values.dealSourceType === "CATEGORIES") {
    payload.scopeCategoryIds = values.scopeCategoryIds;
    return payload;
  }

  payload.scopeMenuItemIds = values.scopeMenuItemIds;

  return payload;
};

export const buildAdminDealCreatePayload = (
  values: AdminDealFormValues
): AdminDealCreatePayload => buildBasePayload(values);

export const buildAdminDealUpdatePayload = (
  values: AdminDealFormValues
): AdminDealUpdatePayload => {
  const payload: AdminDealUpdatePayload = buildBasePayload(values);

  if (values.dealSelectionMode === "FIXED_ITEMS" || values.dealSourceType === "ITEMS") {
    payload.scopeCategoryIds = [];
  } else {
    payload.scopeMenuItemIds = [];
  }

  return payload;
};
