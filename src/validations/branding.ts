import { z } from "zod";

const themeModes = ["light", "dark", "system"] as const;
const buttonStyles = ["rounded", "pill", "square"] as const;
const homeLayouts = ["hero", "grid", "minimal"] as const;
const menuCardStyles = ["image-top", "compact", "image-left"] as const;

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a valid #RGB or #RRGGBB color");

export const optionalUrlSchema = z
  .string()
  .refine((value) => {
    if (value === "") {
      return true;
    }

    if (value.startsWith("/")) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an empty value, a relative path, or a valid http/https URL");

const borderRadiusSchema = z
  .string()
  .regex(/^(?:0|\d+(?:\.\d+)?)(?:px|rem)$/, "Use a valid px or rem radius");

const supportContactSchema = z.object({
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
});

const logoSetSchema = z.object({
  primaryLogoUrl: optionalUrlSchema,
  compactLogoUrl: optionalUrlSchema.optional(),
  faviconUrl: optionalUrlSchema.optional(),
});

const darkThemeOptionsSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
});

const themeOptionsSchema = z.object({
  mode: z.enum(themeModes),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
  dark: darkThemeOptionsSchema,
  fontFamily: z.string().min(1),
  headingFontFamily: z.string().min(1),
  borderRadius: borderRadiusSchema,
  buttonStyle: z.enum(buttonStyles),
  homeLayout: z.enum(homeLayouts),
  menuCardStyle: z.enum(menuCardStyles),
  showPopularItems: z.boolean(),
  showCategories: z.boolean(),
});

const appOptionsSchema = z.object({
  homeLayout: z.enum(homeLayouts),
  menuCardStyle: z.enum(menuCardStyles),
  showTagline: z.boolean(),
  showHeroBanner: z.boolean(),
  splashColor: hexColorSchema,
  statusBarColor: hexColorSchema,
  bottomNavColor: hexColorSchema,
});

const checkoutOptionsSchema = z.object({
  showLogo: z.boolean(),
  showSupportContact: z.boolean(),
  successMessage: z.string(),
  highlightColor: hexColorSchema,
  successColor: hexColorSchema,
  warningColor: hexColorSchema,
  errorColor: hexColorSchema,
});

const assetOptionsSchema = z.object({
  logoUrl: optionalUrlSchema,
  coverImage: optionalUrlSchema,
  heroBannerUrl: optionalUrlSchema,
  placeholderImage: optionalUrlSchema,
  faviconUrl: optionalUrlSchema,
  logos: logoSetSchema,
});

export const brandingSchema = z.object({
  theme: themeOptionsSchema,
  app: appOptionsSchema,
  checkout: checkoutOptionsSchema,
  assets: assetOptionsSchema,
  logo: z.object({
    light: optionalUrlSchema,
    dark: optionalUrlSchema,
  }),
  admin: z
    .object({
      previewEnabled: z.boolean(),
      lastUpdatedBy: z.string().optional(),
    })
    .optional(),
});

const socialMediaSchema = z.object({
  website: optionalUrlSchema.optional(),
  facebook: optionalUrlSchema.optional(),
  instagram: optionalUrlSchema.optional(),
  x: optionalUrlSchema.optional(),
  tiktok: optionalUrlSchema.optional(),
});

export const restaurantBrandingProfileSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  customDomain: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  name: z.string().min(1, "Restaurant name is required"),
  slug: z.string().min(1, "Restaurant slug is required"),
  logoUrl: optionalUrlSchema,
  coverImage: optionalUrlSchema,
  tagline: z.string(),
  bio: z.string(),
  supportContact: supportContactSchema,
  branding: brandingSchema,
  socialMedia: socialMediaSchema,
});

export const restaurantBrandingPayloadSchema = z.object({
  restaurant: restaurantBrandingProfileSchema,
});

export type BrandingFormValues = z.infer<typeof restaurantBrandingPayloadSchema>;
