import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import type {
  BrandingButtonStyle,
  BrandingHomeLayout,
  BrandingMenuCardStyle,
  BrandingThemeMode,
  RestaurantBrandingPayload,
  RestaurantBrandingPatchPayload,
} from "@/types/branding";
import { restaurantBrandingPayloadSchema } from "@/validations/branding";

const themeModes: readonly BrandingThemeMode[] = ["light", "dark", "system"];
const buttonStyles: readonly BrandingButtonStyle[] = ["rounded", "pill", "square"];
const homeLayouts: readonly BrandingHomeLayout[] = ["hero", "grid", "minimal"];
const menuCardStyles: readonly BrandingMenuCardStyle[] = ["image-top", "compact", "image-left"];
const apiThemeKeys = [
  "mode",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundColor",
  "textColor",
  "dark",
  "fontFamily",
  "headingFontFamily",
  "borderRadius",
  "buttonStyle",
  "homeLayout",
  "menuCardStyle",
  "showPopularItems",
  "showCategories",
] as const;

const knownBackendBrandingKeys = new Set<string>([
  ...apiThemeKeys,
  "theme",
  "app",
  "checkout",
  "assets",
  "logo",
  "admin",
  "extra",
]);

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const radiusPattern = /^(?:0|\d+(?:\.\d+)?)(?:px|rem)$/;

const cloneDefaultPayload = (): RestaurantBrandingPayload =>
  structuredClone(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (source: Record<string, unknown> | undefined, key: string): Record<string, unknown> | undefined => {
  if (!source) {
    return undefined;
  }

  const value = source[key];
  return isRecord(value) ? value : undefined;
};

const getString = (
  source: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
  validator?: (value: string) => boolean,
): string => {
  const value = source?.[key];
  if (typeof value !== "string") {
    return fallback;
  }

  if (validator && !validator(value)) {
    return fallback;
  }

  return value;
};

const getOptionalString = (source: Record<string, unknown> | undefined, key: string): string | undefined => {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
};

const getBoolean = (source: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean => {
  const value = source?.[key];
  return typeof value === "boolean" ? value : fallback;
};

const getEnum = <T extends string>(
  source: Record<string, unknown> | undefined,
  key: string,
  allowedValues: readonly T[],
  fallback: T,
): T => {
  const value = source?.[key];
  return typeof value === "string" && allowedValues.includes(value as T) ? (value as T) : fallback;
};

const isOptionalUrl = (value: string): boolean => {
  if (value === "" || value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const deepMergeRecords = (base: unknown, override: unknown): unknown => {
  if (!isRecord(base) || !isRecord(override)) {
    return override === undefined ? base : override;
  }

  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const currentValue = merged[key];
    merged[key] = isRecord(currentValue) && isRecord(value) ? deepMergeRecords(currentValue, value) : value;
  }

  return merged;
};

const hasRestaurantPayloadFields = (value: Record<string, unknown>): boolean =>
  "id" in value ||
  "tenantId" in value ||
  "name" in value ||
  "slug" in value ||
  "logoUrl" in value ||
  "coverImage" in value ||
  "customDomain" in value ||
  "settings" in value ||
  "branding" in value ||
  "supportContact" in value ||
  "socialMedia" in value;

const normalizeApiRestaurantRecord = (restaurant: Record<string, unknown>): Record<string, unknown> => {
  const branding = getRecord(restaurant, "branding");

  if (!branding) {
    return restaurant;
  }

  const flattenedThemeValues = apiThemeKeys.reduce<Record<string, unknown>>((acc, key) => {
    if (key in branding) {
      acc[key] = branding[key];
    }

    return acc;
  }, {});
  const extra = Object.entries(branding).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (!knownBackendBrandingKeys.has(key)) {
      acc[key] = value;
    }

    return acc;
  }, {});
  const normalizedBranding: Record<string, unknown> = {
    ...branding,
    theme: deepMergeRecords(flattenedThemeValues, getRecord(branding, "theme") ?? {}),
  };

  if (Object.keys(extra).length > 0) {
    normalizedBranding.extra = extra;
  }

  return {
    ...restaurant,
    branding: normalizedBranding,
  };
};

const mergeCustomerHomeBranding = (restaurant: Record<string, unknown>, source?: Record<string, unknown>) => {
  const config = getRecord(source, "config");
  const configBranding = getRecord(config, "branding");

  if (!configBranding) {
    return restaurant;
  }

  return {
    ...restaurant,
    branding: deepMergeRecords(getRecord(restaurant, "branding") ?? {}, configBranding),
  };
};

const getApiRestaurantCandidate = (response: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(response)) {
    return undefined;
  }

  const directRestaurant = getRecord(response, "restaurant");
  if (directRestaurant) {
    return mergeCustomerHomeBranding(directRestaurant, response);
  }

  const data = getRecord(response, "data");
  const nestedData = getRecord(data, "data");
  const responseData = nestedData ?? data;
  const dataRestaurant = getRecord(responseData, "restaurant");
  if (dataRestaurant) {
    return mergeCustomerHomeBranding(dataRestaurant, responseData);
  }

  if (responseData && hasRestaurantPayloadFields(responseData)) {
    return responseData;
  }

  if (hasRestaurantPayloadFields(response)) {
    return response;
  }

  return undefined;
};

const expandHexColor = (hexColor: string): string => {
  if (hexColor.length === 4) {
    const [, red, green, blue] = hexColor;
    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  return hexColor.toUpperCase();
};

const hexToRgb = (hexColor: string): { red: number; green: number; blue: number } | null => {
  if (!isHexColor(hexColor)) {
    return null;
  }

  const normalized = expandHexColor(hexColor).slice(1);
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

export const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && hexColorPattern.test(value);

export const normalizeHexColor = (value: unknown, fallback: string): string =>
  isHexColor(value) ? value : fallback;

export const getReadableTextColor = (hexColor: string): string => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return "#030401";
  }

  const luminance = (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) / 255;
  return luminance > 0.58 ? "#030401" : "#FFFFFF";
};

export const deepMergeBrandingPayload = (
  base: RestaurantBrandingPayload,
  override: unknown,
): RestaurantBrandingPayload => normalizeBrandingPayload(deepMergeRecords(base, override));

export const normalizeBrandingApiResponse = (response: unknown): RestaurantBrandingPayload => {
  const restaurantCandidate = getApiRestaurantCandidate(response);

  if (!restaurantCandidate) {
    return cloneDefaultPayload();
  }

  return normalizeBrandingPayload({
    restaurant: normalizeApiRestaurantRecord(restaurantCandidate),
  });
};

export const buildRestaurantBrandingPatchPayload = (
  payload: RestaurantBrandingPayload,
): RestaurantBrandingPatchPayload => {
  const normalizedPayload = normalizeBrandingPayload(payload);
  const { restaurant } = normalizedPayload;
  const { branding } = restaurant;
  const { theme } = branding;

  return {
    name: restaurant.name,
    slug: restaurant.slug,
    logoUrl: restaurant.logoUrl,
    coverImage: restaurant.coverImage,
    customDomain: restaurant.customDomain ?? "",
    tagline: restaurant.tagline,
    bio: restaurant.bio,
    supportContact: {
      email: restaurant.supportContact.email,
      phone: restaurant.supportContact.phone,
      whatsapp: restaurant.supportContact.whatsapp,
    },
    socialMedia: restaurant.socialMedia,
    branding: {
      ...(branding.extra ?? {}),
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      dark: theme.dark,
      fontFamily: theme.fontFamily,
      headingFontFamily: theme.headingFontFamily,
      borderRadius: theme.borderRadius,
      buttonStyle: theme.buttonStyle,
      theme: branding.theme,
      app: branding.app,
      checkout: branding.checkout,
      assets: branding.assets,
      logo: branding.logo,
    },
  };
};

export const normalizeBrandingPayload = (input: unknown): RestaurantBrandingPayload => {
  const defaults = cloneDefaultPayload();
  const merged = deepMergeRecords(defaults, input);

  if (restaurantBrandingPayloadSchema.safeParse(merged).success) {
    return merged as RestaurantBrandingPayload;
  }

  const root = isRecord(merged) ? merged : undefined;
  const restaurant = getRecord(root, "restaurant");
  const branding = getRecord(restaurant, "branding");
  const theme = getRecord(branding, "theme");
  const app = getRecord(branding, "app");
  const checkout = getRecord(branding, "checkout");
  const assets = getRecord(branding, "assets");
  const logo = getRecord(branding, "logo");
  const logos = getRecord(assets, "logos");
  const admin = getRecord(branding, "admin");
  const brandingExtra = getRecord(branding, "extra");
  const supportContact = getRecord(restaurant, "supportContact");
  const socialMedia = getRecord(restaurant, "socialMedia");
  const settings = getRecord(restaurant, "settings");

  return {
    restaurant: {
      ...(getOptionalString(restaurant, "id") ? { id: getOptionalString(restaurant, "id") } : {}),
      ...(getOptionalString(restaurant, "tenantId") ? { tenantId: getOptionalString(restaurant, "tenantId") } : {}),
      customDomain: getString(restaurant, "customDomain", defaults.restaurant.customDomain ?? ""),
      ...(settings ? { settings } : {}),
      name: getString(restaurant, "name", defaults.restaurant.name, (value) => value.trim().length > 0),
      slug: getString(restaurant, "slug", defaults.restaurant.slug, (value) => value.trim().length > 0),
      logoUrl: getString(restaurant, "logoUrl", defaults.restaurant.logoUrl, isOptionalUrl),
      coverImage: getString(restaurant, "coverImage", defaults.restaurant.coverImage, isOptionalUrl),
      tagline: getString(restaurant, "tagline", defaults.restaurant.tagline),
      bio: getString(restaurant, "bio", defaults.restaurant.bio),
      supportContact: {
        email: getString(supportContact, "email", defaults.restaurant.supportContact.email ?? ""),
        phone: getString(supportContact, "phone", defaults.restaurant.supportContact.phone ?? ""),
        whatsapp: getString(supportContact, "whatsapp", defaults.restaurant.supportContact.whatsapp ?? ""),
        address: getString(supportContact, "address", defaults.restaurant.supportContact.address ?? ""),
      },
      branding: {
        theme: {
          mode: getEnum(theme, "mode", themeModes, defaults.restaurant.branding.theme.mode),
          primaryColor: getString(theme, "primaryColor", defaults.restaurant.branding.theme.primaryColor, isHexColor),
          secondaryColor: getString(theme, "secondaryColor", defaults.restaurant.branding.theme.secondaryColor, isHexColor),
          accentColor: getString(theme, "accentColor", defaults.restaurant.branding.theme.accentColor, isHexColor),
          backgroundColor: getString(theme, "backgroundColor", defaults.restaurant.branding.theme.backgroundColor, isHexColor),
          textColor: getString(theme, "textColor", defaults.restaurant.branding.theme.textColor, isHexColor),
          dark: {
            primaryColor: getString(getRecord(theme, "dark"), "primaryColor", defaults.restaurant.branding.theme.dark.primaryColor, isHexColor),
            secondaryColor: getString(getRecord(theme, "dark"), "secondaryColor", defaults.restaurant.branding.theme.dark.secondaryColor, isHexColor),
            accentColor: getString(getRecord(theme, "dark"), "accentColor", defaults.restaurant.branding.theme.dark.accentColor, isHexColor),
            backgroundColor: getString(getRecord(theme, "dark"), "backgroundColor", defaults.restaurant.branding.theme.dark.backgroundColor, isHexColor),
            textColor: getString(getRecord(theme, "dark"), "textColor", defaults.restaurant.branding.theme.dark.textColor, isHexColor),
          },
          fontFamily: getString(theme, "fontFamily", defaults.restaurant.branding.theme.fontFamily, (value) => value.trim().length > 0),
          headingFontFamily: getString(theme, "headingFontFamily", defaults.restaurant.branding.theme.headingFontFamily, (value) => value.trim().length > 0),
          borderRadius: getString(theme, "borderRadius", defaults.restaurant.branding.theme.borderRadius, (value) => radiusPattern.test(value)),
          buttonStyle: getEnum(theme, "buttonStyle", buttonStyles, defaults.restaurant.branding.theme.buttonStyle),
          homeLayout: getEnum(theme, "homeLayout", homeLayouts, defaults.restaurant.branding.theme.homeLayout),
          menuCardStyle: getEnum(theme, "menuCardStyle", menuCardStyles, defaults.restaurant.branding.theme.menuCardStyle),
          showPopularItems: getBoolean(theme, "showPopularItems", defaults.restaurant.branding.theme.showPopularItems),
          showCategories: getBoolean(theme, "showCategories", defaults.restaurant.branding.theme.showCategories),
        },
        app: {
          homeLayout: getEnum(app, "homeLayout", homeLayouts, defaults.restaurant.branding.app.homeLayout),
          menuCardStyle: getEnum(app, "menuCardStyle", menuCardStyles, defaults.restaurant.branding.app.menuCardStyle),
          showTagline: getBoolean(app, "showTagline", defaults.restaurant.branding.app.showTagline),
          showHeroBanner: getBoolean(app, "showHeroBanner", defaults.restaurant.branding.app.showHeroBanner),
          splashColor: getString(app, "splashColor", defaults.restaurant.branding.app.splashColor, isHexColor),
          statusBarColor: getString(app, "statusBarColor", defaults.restaurant.branding.app.statusBarColor, isHexColor),
          bottomNavColor: getString(app, "bottomNavColor", defaults.restaurant.branding.app.bottomNavColor, isHexColor),
        },
        checkout: {
          showLogo: getBoolean(checkout, "showLogo", defaults.restaurant.branding.checkout.showLogo),
          showSupportContact: getBoolean(checkout, "showSupportContact", defaults.restaurant.branding.checkout.showSupportContact),
          successMessage: getString(checkout, "successMessage", defaults.restaurant.branding.checkout.successMessage),
          highlightColor: getString(checkout, "highlightColor", defaults.restaurant.branding.checkout.highlightColor, isHexColor),
          successColor: getString(checkout, "successColor", defaults.restaurant.branding.checkout.successColor, isHexColor),
          warningColor: getString(checkout, "warningColor", defaults.restaurant.branding.checkout.warningColor, isHexColor),
          errorColor: getString(checkout, "errorColor", defaults.restaurant.branding.checkout.errorColor, isHexColor),
        },
        assets: {
          logoUrl: getString(assets, "logoUrl", defaults.restaurant.branding.assets.logoUrl, isOptionalUrl),
          coverImage: getString(assets, "coverImage", defaults.restaurant.branding.assets.coverImage, isOptionalUrl),
          heroBannerUrl: getString(assets, "heroBannerUrl", defaults.restaurant.branding.assets.heroBannerUrl, isOptionalUrl),
          placeholderImage: getString(assets, "placeholderImage", defaults.restaurant.branding.assets.placeholderImage, isOptionalUrl),
          faviconUrl: getString(assets, "faviconUrl", defaults.restaurant.branding.assets.faviconUrl, isOptionalUrl),
          logos: {
            primaryLogoUrl: getString(logos, "primaryLogoUrl", defaults.restaurant.branding.assets.logos.primaryLogoUrl, isOptionalUrl),
            compactLogoUrl: getString(logos, "compactLogoUrl", defaults.restaurant.branding.assets.logos.compactLogoUrl ?? "", isOptionalUrl),
            faviconUrl: getString(logos, "faviconUrl", defaults.restaurant.branding.assets.logos.faviconUrl ?? "", isOptionalUrl),
          },
        },
        logo: {
          light: getString(logo, "light", defaults.restaurant.branding.logo.light, isOptionalUrl),
          dark: getString(logo, "dark", defaults.restaurant.branding.logo.dark, isOptionalUrl),
        },
        admin: {
          previewEnabled: getBoolean(admin, "previewEnabled", defaults.restaurant.branding.admin?.previewEnabled ?? true),
          lastUpdatedBy: getString(admin, "lastUpdatedBy", defaults.restaurant.branding.admin?.lastUpdatedBy ?? ""),
        },
        ...(brandingExtra ? { extra: brandingExtra } : {}),
      },
      socialMedia: {
        website: getString(socialMedia, "website", defaults.restaurant.socialMedia.website ?? "", isOptionalUrl),
        facebook: getString(socialMedia, "facebook", defaults.restaurant.socialMedia.facebook ?? "", isOptionalUrl),
        instagram: getString(socialMedia, "instagram", defaults.restaurant.socialMedia.instagram ?? "", isOptionalUrl),
        x: getString(socialMedia, "x", defaults.restaurant.socialMedia.x ?? "", isOptionalUrl),
        tiktok: getString(socialMedia, "tiktok", defaults.restaurant.socialMedia.tiktok ?? "", isOptionalUrl),
      },
    },
  };
};

const getButtonRadius = (buttonStyle: BrandingButtonStyle, borderRadius: string): string => {
  if (buttonStyle === "pill") {
    return "9999px";
  }

  if (buttonStyle === "square") {
    return "0px";
  }

  return borderRadius;
};

const prefersDarkTheme = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const shouldUseDarkPalette = (mode: BrandingThemeMode) => mode === "dark" || (mode === "system" && prefersDarkTheme());

const getActiveThemePalette = (theme: RestaurantBrandingPayload["restaurant"]["branding"]["theme"]) =>
  shouldUseDarkPalette(theme.mode) ? theme.dark : theme;

const getThemeSurfaceColor = (backgroundColor: string) => (backgroundColor === "#F5F5F5" ? "#FFFFFF" : backgroundColor);

export const brandingPayloadToCssVariables = (payload: RestaurantBrandingPayload): Record<string, string> => {
  const normalizedPayload = normalizeBrandingPayload(payload);
  const { theme } = normalizedPayload.restaurant.branding;
  const activeTheme = getActiveThemePalette(theme);
  const buttonRadius = getButtonRadius(theme.buttonStyle, theme.borderRadius);

  return {
    "--brand-primary": activeTheme.primaryColor,
    "--brand-secondary": activeTheme.secondaryColor,
    "--brand-accent": activeTheme.accentColor,
    "--brand-background": activeTheme.backgroundColor,
    "--brand-surface": getThemeSurfaceColor(activeTheme.backgroundColor),
    "--brand-text": activeTheme.textColor,
    "--brand-radius": theme.borderRadius,
    "--brand-font-family": theme.fontFamily,
    "--brand-heading-font-family": theme.headingFontFamily,
    "--brand-button-radius": buttonRadius,
    "--primary": activeTheme.primaryColor,
    "--ring": activeTheme.primaryColor,
    "--background": activeTheme.backgroundColor,
    "--foreground": activeTheme.textColor,
    "--dark": activeTheme.textColor,
    "--radius": theme.borderRadius,
    "--sidebar-primary": theme.primaryColor,
    "--sidebar-ring": theme.primaryColor,
  };
};

export const applyBrandingCssVariables = (payload: RestaurantBrandingPayload, target?: HTMLElement): void => {
  if (typeof document === "undefined" && !target) {
    return;
  }

  const normalizedPayload = normalizeBrandingPayload(payload);
  const targetElement = target ?? document.documentElement;
  const variables = brandingPayloadToCssVariables(normalizedPayload);

  for (const [key, value] of Object.entries(variables)) {
    targetElement.style.setProperty(key, value);
  }

  targetElement.dataset.brandButtonStyle = normalizedPayload.restaurant.branding.theme.buttonStyle;
  targetElement.dataset.brandThemeMode = normalizedPayload.restaurant.branding.theme.mode;
};
