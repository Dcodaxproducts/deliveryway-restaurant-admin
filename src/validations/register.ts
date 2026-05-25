import { z } from "zod";

/* ---------------- FILE SCHEMAS ---------------- */

export const image2MB = z
  .any()
  .refine((file) => file instanceof File, "File is required")
  .refine((file) => file?.size <= 2 * 1024 * 1024, "File must be less than 2MB")
  .refine(
    (file) =>
      ["image/png", "image/jpeg", "image/jpg"].includes(file?.type),
    "Only PNG, JPG, JPEG allowed"
  );

export const image1MB = z
  .any()
  .refine((file) => file instanceof File, "Image is required")
  .refine((file) => file?.size <= 1 * 1024 * 1024, "Image must be less than 1MB")
  .refine(
    (file) =>
      ["image/png", "image/jpeg", "image/jpg"].includes(file?.type),
    "Only PNG, JPG, JPEG allowed"
  );

/* ---------------- USER ---------------- */

export const userSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),

  profileUrl: image2MB,
});

/* ---------------- TENANT ---------------- */

export const tenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  bio: z.string().min(1, "Tenant bio is required"),
  logoUrl: image2MB,
});

/* ---------------- RESTAURANT ---------------- */

export const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),

  logoUrl: image2MB,

  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain lowercase letters, numbers, and hyphens only"),

  tagline: z.string().min(1, "Tagline is required"),

  supportContact: z.object({
    email: z.string().min(1, "Support email is required").email("Invalid email"),
    phone: z.string().min(1, "Support phone is required"),
    whatsapp: z
      .string()
      .min(1, "WhatsApp number is required")
      .regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number"),
  }),

  branding: z.object({
    primaryColor: z
      .string()
      .min(1, "Primary color is required")
      .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid hex color"),

    secondaryColor: z
      .string()
      .min(1, "Secondary color is required")
      .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid hex color"),

    fontFamily: z.string().min(1, "Font family is required"),
  }),
});

/* ---------------- BRANCH ---------------- */

export const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),

  description: z.string().min(1, "Description is required"),

  coverImage: image1MB,

  address: z.object({
    street: z.string().min(1, "Street is required"),
    area: z.string().min(1, "Area is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),

    lat: z
      .string()
      .min(1, "Latitude is required")
      .refine((val) => !isNaN(Number(val)), "Latitude must be a number"),

    lng: z
      .string()
      .min(1, "Longitude is required")
      .refine((val) => !isNaN(Number(val)), "Longitude must be a number"),
  }),

  settings: z.object({
    taxPercentage: z
      .number({ invalid_type_error: "Tax percentage required" })
      .min(0, "Invalid tax value"),

    minOrderAmount: z
      .number({ invalid_type_error: "Minimum order required" })
      .min(0, "Invalid amount"),

    radiusKm: z
      .number({ invalid_type_error: "Radius required" })
      .min(0, "Invalid radius"),

    estimatedPrepTime: z
      .number({ invalid_type_error: "Prep time required" })
      .min(0, "Invalid prep time"),
  }),
});