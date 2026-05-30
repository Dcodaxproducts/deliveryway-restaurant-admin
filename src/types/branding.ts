export type BrandingThemeMode = "light" | "dark" | "system";
export type BrandingButtonStyle = "rounded" | "pill" | "square";
export type BrandingHomeLayout = "hero" | "grid" | "minimal";
export type BrandingMenuCardStyle = "image-top" | "compact" | "image-left";

export type SupportContact = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
};

export type BrandingLogoSet = {
  primaryLogoUrl: string;
  compactLogoUrl?: string;
  faviconUrl?: string;
};

export type BrandingDarkThemeOptions = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
};

export type BrandingThemeOptions = {
  mode: BrandingThemeMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  dark: BrandingDarkThemeOptions;
  fontFamily: string;
  headingFontFamily: string;
  borderRadius: string;
  buttonStyle: BrandingButtonStyle;
  homeLayout: BrandingHomeLayout;
  menuCardStyle: BrandingMenuCardStyle;
  showPopularItems: boolean;
  showCategories: boolean;
};

export type BrandingAppOptions = {
  homeLayout: BrandingHomeLayout;
  menuCardStyle: BrandingMenuCardStyle;
  showTagline: boolean;
  showHeroBanner: boolean;
  splashColor: string;
  statusBarColor: string;
  bottomNavColor: string;
};

export type BrandingCheckoutOptions = {
  showLogo: boolean;
  showSupportContact: boolean;
  successMessage: string;
  highlightColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
};

export type BrandingAssetOptions = {
  logoUrl: string;
  coverImage: string;
  heroBannerUrl: string;
  placeholderImage: string;
  faviconUrl: string;
  logos: BrandingLogoSet;
};

export type RestaurantBranding = {
  theme: BrandingThemeOptions;
  app: BrandingAppOptions;
  checkout: BrandingCheckoutOptions;
  assets: BrandingAssetOptions;
  logo: {
    light: string;
    dark: string;
  };
  admin?: {
    previewEnabled: boolean;
    lastUpdatedBy?: string;
  };
};

export type RestaurantSocialMedia = {
  website?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  tiktok?: string;
};

export type RestaurantBrandingProfile = {
  id?: string;
  tenantId?: string;
  customDomain?: string;
  settings?: Record<string, unknown>;
  name: string;
  slug: string;
  logoUrl: string;
  coverImage: string;
  tagline: string;
  bio: string;
  supportContact: SupportContact;
  branding: RestaurantBranding;
  socialMedia: RestaurantSocialMedia;
};

export type RestaurantBrandingPayload = {
  restaurant: RestaurantBrandingProfile;
};

export type RestaurantBrandingPatchPayload = {
  name: string;
  slug: string;
  logoUrl: string;
  coverImage: string;
  customDomain?: string;
  tagline: string;
  bio: string;
  supportContact: SupportContact;
  socialMedia: RestaurantSocialMedia;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    dark: BrandingDarkThemeOptions;
    fontFamily: string;
    headingFontFamily: string;
    borderRadius: string;
    buttonStyle: BrandingButtonStyle;
    theme: BrandingThemeOptions;
    app: BrandingAppOptions;
    checkout: BrandingCheckoutOptions;
    assets: BrandingAssetOptions;
    logo: RestaurantBranding["logo"];
  };
};
