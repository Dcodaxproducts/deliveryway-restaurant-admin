import { z } from "zod";

import { fromDateTimeLocalValue } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import type {
  AdminDealCreatePayload,
  AdminDealFormValues,
  AdminDealUpdatePayload,
} from "@/types/admin-deals";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z.number().min(0).optional()
);

const optionalInteger = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  },
  z.number().int().min(1).optional()
);

export const adminDealFormSchema = z
  .object({
    code: optionalText,
    title: z.string().trim().min(1, "Title is required."),
    description: optionalText,
    restaurantId: optionalText,
    branchId: optionalText,
    discountValue: z.preprocess(
      (value) => Number(value),
      z.number().positive("Fixed Deal Price must be greater than 0.")
    ),
    maxDiscountAmount: optionalNumber.nullable(),
    minOrderAmount: optionalNumber.nullable(),
    maxUses: optionalInteger.nullable(),
    maxUsesPerCustomer: optionalInteger.nullable(),
    startsAt: z.string().trim().min(1, "Starts At is required."),
    expiresAt: z.string().trim().min(1, "Expires At is required."),
    scopeMenuItemIds: z
      .array(z.string())
      .min(2, "Select at least 2 menu items for a deal."),
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

type BaseAdminDealPayload = Omit<AdminDealCreatePayload, "autoApply">;

const addOptionalNumber = (
  payload: BaseAdminDealPayload,
  key:
    | "maxDiscountAmount"
    | "minOrderAmount"
    | "maxUses"
    | "maxUsesPerCustomer",
  value: number | null | undefined
) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    payload[key] = value;
  }
};

const buildBasePayload = (values: AdminDealFormValues) => {
  const payload: BaseAdminDealPayload = {
    title: values.title.trim(),
    discountValue: values.discountValue,
    startsAt: fromDateTimeLocalValue(values.startsAt),
    expiresAt: fromDateTimeLocalValue(values.expiresAt),
    scopeMenuItemIds: values.scopeMenuItemIds,
    isActive: values.isActive,
  };

  if (values.code?.trim()) payload.code = values.code.trim();
  if (values.description?.trim()) payload.description = values.description.trim();
  if (values.restaurantId?.trim()) payload.restaurantId = values.restaurantId.trim();
  if (values.branchId?.trim()) payload.branchId = values.branchId.trim();

  addOptionalNumber(payload, "maxDiscountAmount", values.maxDiscountAmount);
  addOptionalNumber(payload, "minOrderAmount", values.minOrderAmount);
  addOptionalNumber(payload, "maxUses", values.maxUses);
  addOptionalNumber(payload, "maxUsesPerCustomer", values.maxUsesPerCustomer);

  return payload;
};

export const buildAdminDealCreatePayload = (
  values: AdminDealFormValues
): AdminDealCreatePayload => ({
  ...buildBasePayload(values),
  autoApply: true,
});

export const buildAdminDealUpdatePayload = (
  values: AdminDealFormValues
): AdminDealUpdatePayload => buildBasePayload(values);
