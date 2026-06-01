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
});

export const editBranchSchema = z.object({
  name: z.string().trim().min(1, validationMessages.required),
  description: z.string().optional(),
  isMain: z.boolean().optional(),
  restaurantId: z.string().optional(),
  branchAdmin: z.any().optional(),
  address: z
    .object({
      street: z.string().optional(),
      area: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      lat: z.any().optional(),
      lng: z.any().optional(),
    })
    .optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export type EditBranchValues = z.infer<typeof editBranchSchema>;
export type DeliveryConfigValues = z.infer<typeof deliveryConfigSchema>;
