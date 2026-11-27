import { getLocalizedMessage } from "@/lib/localized-message";
import { z } from "zod";

import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
} from "@/services/storage";

/* ---------------- FILE SCHEMAS ---------------- */

export const image2MB = z
  .any()
  .refine((file) => file instanceof File, getLocalizedMessage("validation038"))
  .refine(
    (file) => file?.size <= MAX_UPLOAD_FILE_SIZE_BYTES,
    `File must be less than ${MAX_UPLOAD_FILE_SIZE_MB}MB`,
  )
  .refine(
    (file) => ["image/png", "image/jpeg", "image/jpg"].includes(file?.type),
    getLocalizedMessage("validation074"),
  );

export const image1MB = z
  .any()
  .refine((file) => file instanceof File, getLocalizedMessage("validation045"))
  .refine(
    (file) => file?.size <= MAX_UPLOAD_FILE_SIZE_BYTES,
    `Image must be less than ${MAX_UPLOAD_FILE_SIZE_MB}MB`,
  )
  .refine(
    (file) => ["image/png", "image/jpeg", "image/jpg"].includes(file?.type),
    getLocalizedMessage("validation074"),
  );

/* ---------------- USER ---------------- */

export const userSchema = z.object({
  firstName: z
    .string()
    .min(1, getLocalizedMessage("validation039"))
    .min(2, getLocalizedMessage("validation040")),

  lastName: z
    .string()
    .min(1, getLocalizedMessage("validation060"))
    .min(2, getLocalizedMessage("validation061")),

  email: z.string().min(1, getLocalizedMessage("validation032")).email(getLocalizedMessage("validation050")),

  phone: z
    .string()
    .min(1, getLocalizedMessage("validation083"))
    .regex(/^\+?[0-9]{10,15}$/, getLocalizedMessage("validation052")),

  password: z
    .string()
    .min(1, getLocalizedMessage("validation079"))
    .min(8, getLocalizedMessage("validation080")),

  profileUrl: image2MB,
});

/* ---------------- TENANT ---------------- */

export const tenantSchema = z.object({
  name: z.string().min(1, getLocalizedMessage("validation124")),
  bio: z.string().min(1, getLocalizedMessage("validation123")),
  logoUrl: image2MB,
});

/* ---------------- RESTAURANT ---------------- */

export const restaurantSchema = z.object({
  name: z.string().min(1, getLocalizedMessage("validation098")),

  logoUrl: image2MB,

  slug: z
    .string()
    .min(1, getLocalizedMessage("validation110"))
    .regex(
      /^[a-z0-9-]+$/,
      getLocalizedMessage("validation111"),
    ),

  tagline: z.string().min(1, getLocalizedMessage("validation121")),

  supportContact: z.object({
    email: z
      .string()
      .min(1, getLocalizedMessage("validation118"))
      .email(getLocalizedMessage("validation048")),
    phone: z.string().min(1, getLocalizedMessage("validation119")),
    whatsapp: z
      .string()
      .regex(/^\+?[0-9]{10,15}$/, getLocalizedMessage("validation057"))
      .or(z.literal(""))
      .optional(),
  }),

  branding: z.object({
    primaryColor: z
      .string()
      .min(1, getLocalizedMessage("validation093"))
      .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, getLocalizedMessage("validation051")),

    secondaryColor: z
      .string()
      .min(1, getLocalizedMessage("validation102"))
      .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, getLocalizedMessage("validation051")),

    fontFamily: z.string().min(1, getLocalizedMessage("validation042")),
  }),
});

/* ---------------- BRANCH ---------------- */

export const branchSchema = z.object({
  name: z.string().min(1, getLocalizedMessage("validation015")),

  description: z.string().min(1, getLocalizedMessage("validation028")),

  coverImage: image1MB,

  address: z.object({
    street: z.string().min(1, getLocalizedMessage("validation117")),
    area: z.string().min(1, getLocalizedMessage("validation004")),
    city: z.string().min(1, getLocalizedMessage("validation020")),
    state: z.string().min(1, getLocalizedMessage("validation115")),
    country: z.string().min(1, getLocalizedMessage("validation021")),

    lat: z
      .string()
      .min(1, getLocalizedMessage("validation062"))
      .refine((val) => !isNaN(Number(val)), getLocalizedMessage("validation063")),

    lng: z
      .string()
      .min(1, getLocalizedMessage("validation064"))
      .refine((val) => !isNaN(Number(val)), getLocalizedMessage("validation065")),
  }),

  settings: z.object({
    taxPercentage: z
      .number({ invalid_type_error: getLocalizedMessage("validation122") })
      .min(0, getLocalizedMessage("validation056")),

    minOrderAmount: z
      .number({ invalid_type_error: getLocalizedMessage("validation068") })
      .min(0, getLocalizedMessage("validation047")),

    radiusKm: z
      .number({ invalid_type_error: getLocalizedMessage("validation095") })
      .min(0, getLocalizedMessage("validation054")),

    estimatedPrepTime: z
      .number({ invalid_type_error: getLocalizedMessage("validation092") })
      .min(0, getLocalizedMessage("validation053")),
  }),
});
