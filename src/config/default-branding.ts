import type { RestaurantBrandingPayload } from "@/types/branding";

export const DEFAULT_RESTAURANT_BRANDING_PAYLOAD: RestaurantBrandingPayload = {
  restaurant: {
    name: "Deliveryway Restaurant",
    slug: "deliveryway-restaurant",
    logoUrl: "/logo.png",
    coverImage: "/profile.jpg",
    tagline: "Fast, reliable restaurant delivery",
    bio: "Manage your restaurant storefront, menu, orders, and customer experience from Deliveryway.",
    supportContact: {
      email: "support@deliveryway.com",
      phone: "",
      whatsapp: "",
      address: "",
    },
    branding: {
      theme: {
        mode: "light",
        primaryColor: "#CE181B",
        secondaryColor: "#030401",
        accentColor: "#F59E0B",
        backgroundColor: "#FFFFFF",
        textColor: "#030401",
        fontFamily: "Onest",
        headingFontFamily: "Arimo",
        borderRadius: "12px",
        buttonStyle: "rounded",
      },
      app: {
        homeLayout: "hero",
        menuCardStyle: "image-top",
        showTagline: true,
        showHeroBanner: true,
      },
      checkout: {
        showLogo: true,
        showSupportContact: true,
        successMessage: "Thank you for ordering with us.",
      },
      assets: {
        logoUrl: "/logo.png",
        coverImage: "/profile.jpg",
        heroBannerUrl: "/profile.jpg",
        placeholderImage: "/profile.jpg",
        faviconUrl: "/favicon.ico",
        logos: {
          primaryLogoUrl: "/logo.png",
          compactLogoUrl: "/logo.png",
          faviconUrl: "/favicon.ico",
        },
      },
      admin: {
        previewEnabled: true,
      },
    },
    socialMedia: {
      website: "",
      facebook: "",
      instagram: "",
      x: "",
      tiktok: "",
    },
  },
};
