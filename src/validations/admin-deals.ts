import { getLocalizedMessage } from "@/lib/localized-message";
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

const categoryRuleSchema = z.object({
  menuCategoryId: z.string().trim().min(1, getLocalizedMessage("validation018")),
  itemLimit: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return null;
      return Number(value);
    },
    z.number().int().min(1, getLocalizedMessage("validation058"))
  ),
  variationId: optionalText,
  includedMenuItemIds: z.array(z.string()).default([]),
  excludedMenuItemIds: z.array(z.string()).default([]),
});

const optionalImageUrlSchema = thumbnailUrlSchema.optional().default("");

const getTrimmedUrl = (value: string | null | undefined) => {
  return getOptionalThumbnailUrl(value);
};

const optionalDateTimeLocalSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return undefined;

    const trimmedValue = value.trim();
    if (!trimmedValue) return undefined;

    const date = new Date(trimmedValue);
    return Number.isNaN(date.getTime()) ? undefined : trimmedValue;
  },
  z.string().optional()
);

const getDateFromOptionalDateTime = (value: string | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const adminDealFormSchema = z
  .object({
    title: z.string().trim().min(1, getLocalizedMessage("validation126")),
    description: optionalText,
    audience: z.enum(["GUEST", "REGISTERED", "BOTH"]).default("BOTH"),
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
    dealSourceType: z.enum(["ITEMS", "CATEGORIES", "BOTH"]),
    dealRequiredQuantity: requiredQuantitySchema,
    scopeMenuItemIds: z.array(z.string()).default([]),
    scopeCategoryIds: z.array(z.string()).default([]),
    scopeCategoryRules: z.array(categoryRuleSchema).default([]),
    isActive: z.boolean().default(true),
  })
  .superRefine((values, context) => {
    const startsAt = getDateFromOptionalDateTime(values.startsAt);
    const expiresAt = getDateFromOptionalDateTime(values.expiresAt);

    if (startsAt && expiresAt && expiresAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: getLocalizedMessage("validation035"),
      });
    }

    if (values.dealSelectionMode === "FIXED_ITEMS") {
      if (values.dealSourceType !== "ITEMS") {
        context.addIssue({
          code: "custom",
          path: ["dealSourceType"],
          message: getLocalizedMessage("validation041"),
        });
      }

      if (values.scopeMenuItemIds.length < 2) {
        context.addIssue({
          code: "custom",
          path: ["scopeMenuItemIds"],
          message: getLocalizedMessage("validation104"),
        });
      }

      if (values.scopeCategoryIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["scopeCategoryIds"],
          message: getLocalizedMessage("validation016"),
        });
      }

      return;
    }

    if (values.dealSourceType === "ITEMS") {
      if (!values.dealRequiredQuantity) {
        context.addIssue({
          code: "custom",
          path: ["dealRequiredQuantity"],
          message: getLocalizedMessage("validation096"),
        });
      }

      if (values.scopeCategoryIds.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["scopeCategoryIds"],
          message: getLocalizedMessage("validation019"),
        });
      }

      return;
    }

    if (values.scopeCategoryIds.length < 1) {
      context.addIssue({
        code: "custom",
        path: ["scopeCategoryIds"],
        message: getLocalizedMessage("validation103"),
      });
    }

    const selectedCategoryIds = new Set(values.scopeCategoryIds);
    const selectedRules = values.scopeCategoryRules.filter((rule) =>
      selectedCategoryIds.has(rule.menuCategoryId)
    );

    if (selectedRules.length !== values.scopeCategoryIds.length) {
      context.addIssue({
        code: "custom",
        path: ["scopeCategoryRules"],
        message: getLocalizedMessage("validation031"),
      });
    }

    if (
      values.dealSourceType === "CATEGORIES" &&
      values.scopeMenuItemIds.length > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["scopeMenuItemIds"],
        message: getLocalizedMessage("validation067"),
      });
    }

    if (
      values.dealSourceType === "BOTH" &&
      values.scopeMenuItemIds.length < 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["scopeMenuItemIds"],
        message: getLocalizedMessage("validation106"),
      });
    }

    selectedRules.forEach((rule, index) => {
      const excluded = new Set(rule.excludedMenuItemIds);
      if (rule.includedMenuItemIds.some((id) => excluded.has(id))) {
        context.addIssue({
          code: "custom",
          path: ["scopeCategoryRules", index],
          message: getLocalizedMessage("validation002"),
        });
      }
    });
  });

const buildBasePayload = (values: AdminDealFormValues): AdminDealCreatePayload => {
  const payload: AdminDealCreatePayload = {
    title: values.title.trim(),
    audience: values.audience ?? "BOTH",
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

  if (
    values.dealSourceType === "CATEGORIES" ||
    values.dealSourceType === "BOTH"
  ) {
    const selectedCategoryIds = new Set(values.scopeCategoryIds);
    const scopeCategories = values.scopeCategoryRules
      .filter((rule) => selectedCategoryIds.has(rule.menuCategoryId))
      .map((rule) => ({
        menuCategoryId: rule.menuCategoryId,
        itemLimit: Number(rule.itemLimit ?? 1),
        ...(rule.variationId ? { variationId: rule.variationId } : {}),
        ...(rule.includedMenuItemIds?.length
          ? { includedMenuItemIds: rule.includedMenuItemIds }
          : {}),
        ...(rule.excludedMenuItemIds?.length
          ? { excludedMenuItemIds: rule.excludedMenuItemIds }
          : {}),
      }));
    const dealRequiredQuantity = scopeCategories.reduce(
      (total, rule) => total + rule.itemLimit,
      0
    ) + (values.dealSourceType === "BOTH" ? values.scopeMenuItemIds.length : 0);

    payload.dealRequiredQuantity = dealRequiredQuantity;
    payload.scopeCategories = scopeCategories;
    if (values.dealSourceType === "BOTH") {
      payload.scopeMenuItemIds = values.scopeMenuItemIds;
    }
    return payload;
  }

  if (typeof values.dealRequiredQuantity === "number") {
    payload.dealRequiredQuantity = values.dealRequiredQuantity;
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

  payload.startsAt = payload.startsAt ?? null;
  payload.expiresAt = payload.expiresAt ?? null;

  if (values.dealSelectionMode === "FIXED_ITEMS" || values.dealSourceType === "ITEMS") {
    payload.scopeCategoryIds = [];
    payload.scopeCategories = [];
  } else if (values.dealSourceType === "CATEGORIES") {
    payload.scopeMenuItemIds = [];
  }

  return payload;
};
