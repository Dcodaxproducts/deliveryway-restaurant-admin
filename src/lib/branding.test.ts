import { describe, expect, it } from "vitest";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import {
  brandingPayloadToCssVariables,
  buildRestaurantBrandingPatchPayload,
  getReadableTextColor,
  normalizeBrandingApiResponse,
  normalizeBrandingPayload,
} from "@/lib/branding";

const defaultRestaurant = DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant;
const defaultTheme = defaultRestaurant.branding.theme;

describe("branding helpers", () => {
  it("normalizes partial payload over defaults", () => {
    const payload = normalizeBrandingPayload({
      restaurant: {
        name: "Pizza House",
        slug: "pizza-house",
        branding: {
          theme: {
            primaryColor: "#123456",
          },
        },
      },
    });

    expect(payload.restaurant.name).toBe("Pizza House");
    expect(payload.restaurant.slug).toBe("pizza-house");
    expect(payload.restaurant.branding.theme.primaryColor).toBe("#123456");
    expect(payload.restaurant.branding.theme.secondaryColor).toBe(defaultTheme.secondaryColor);
    expect(payload.restaurant.branding.assets.logoUrl).toBe("/logo.png");
  });

  it("rejects invalid color by falling back", () => {
    const payload = normalizeBrandingPayload({
      restaurant: {
        branding: {
          theme: {
            primaryColor: "red",
          },
        },
      },
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe(defaultTheme.primaryColor);
  });

  it("preserves valid #RGB and #RRGGBB colors", () => {
    const shortColorPayload = normalizeBrandingPayload({
      restaurant: {
        branding: {
          theme: {
            primaryColor: "#ABC",
          },
        },
      },
    });
    const longColorPayload = normalizeBrandingPayload({
      restaurant: {
        branding: {
          theme: {
            primaryColor: "#AABBCC",
          },
        },
      },
    });

    expect(shortColorPayload.restaurant.branding.theme.primaryColor).toBe("#ABC");
    expect(longColorPayload.restaurant.branding.theme.primaryColor).toBe("#AABBCC");
  });

  it("returns readable text color for light and dark backgrounds", () => {
    expect(getReadableTextColor("#FFFFFF")).toBe("#030401");
    expect(getReadableTextColor("#000000")).toBe("#FFFFFF");
  });

  it("maps payload to CSS variables", () => {
    const payload = normalizeBrandingPayload({
      restaurant: {
        branding: {
          theme: {
            primaryColor: "#112233",
            secondaryColor: "#223344",
            accentColor: "#334455",
            backgroundColor: "#FFFFFF",
            textColor: "#030401",
            borderRadius: "8px",
            buttonStyle: "pill",
          },
        },
      },
    });
    const variables = brandingPayloadToCssVariables(payload);

    expect(variables["--brand-primary"]).toBe("#112233");
    expect(variables["--brand-secondary"]).toBe("#223344");
    expect(variables["--brand-accent"]).toBe("#334455");
    expect(variables["--brand-background"]).toBe("#FFFFFF");
    expect(variables["--brand-text"]).toBe("#030401");
    expect(variables["--brand-button-radius"]).toBe("9999px");
    expect(variables["--primary"]).toBe("#112233");
    expect(variables["--ring"]).toBe("#112233");
    expect(variables["--sidebar-ring"]).toBe("#112233");
  });

  it("normalizes provided backend GET envelope shape", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        id: "restaurant-1",
        tenantId: "tenant-1",
        name: "Backend Restaurant",
        slug: "backend-restaurant",
        customDomain: "orders.example.com",
        settings: { printing: { enabled: true } },
        branding: {
          primaryColor: "#E4002B",
        },
      },
      message: "Restaurant fetched",
    });

    expect(payload.restaurant.id).toBe("restaurant-1");
    expect(payload.restaurant.tenantId).toBe("tenant-1");
    expect(payload.restaurant.name).toBe("Backend Restaurant");
    expect(payload.restaurant.slug).toBe("backend-restaurant");
    expect(payload.restaurant.customDomain).toBe("orders.example.com");
    expect(payload.restaurant.settings).toEqual({ printing: { enabled: true } });
    expect(payload.restaurant.branding.theme.primaryColor).toBe("#E4002B");
  });

  it("normalizes API response with data restaurant wrapper", () => {
    const payload = normalizeBrandingApiResponse({
      data: {
        restaurant: {
          name: "Data Wrapped Restaurant",
          slug: "data-wrapped-restaurant",
        },
      },
    });

    expect(payload.restaurant.name).toBe("Data Wrapped Restaurant");
    expect(payload.restaurant.slug).toBe("data-wrapped-restaurant");
  });

  it("normalizes API response with restaurant wrapper", () => {
    const payload = normalizeBrandingApiResponse({
      restaurant: {
        name: "Wrapped Restaurant",
        slug: "wrapped-restaurant",
      },
    });

    expect(payload.restaurant.name).toBe("Wrapped Restaurant");
    expect(payload.restaurant.slug).toBe("wrapped-restaurant");
  });

  it("normalizes API response with direct restaurant object", () => {
    const payload = normalizeBrandingApiResponse({
      name: "Direct Restaurant",
      slug: "direct-restaurant",
    });

    expect(payload.restaurant.name).toBe("Direct Restaurant");
    expect(payload.restaurant.slug).toBe("direct-restaurant");
  });

  it("falls back to defaults for malformed API response", () => {
    const payload = normalizeBrandingApiResponse({ data: ["not", "a", "restaurant"] });

    expect(payload).toEqual(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
  });

  it("maps backend flattened branding.primaryColor to internal theme primaryColor", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        name: "Flat Brand",
        slug: "flat-brand",
        branding: {
          primaryColor: "#778899",
        },
      },
      message: "ok",
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe("#778899");
  });

  it("maps backend flattened branding.secondaryColor to internal theme secondaryColor", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        name: "Flat Brand",
        slug: "flat-brand",
        branding: {
          secondaryColor: "#FFFFFF",
        },
      },
      message: "ok",
    });

    expect(payload.restaurant.branding.theme.secondaryColor).toBe("#FFFFFF");
  });

  it("maps backend flattened branding.fontFamily to internal theme fontFamily", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        name: "Flat Brand",
        slug: "flat-brand",
        branding: {
          fontFamily: "Poppins",
        },
      },
      message: "ok",
    });

    expect(payload.restaurant.branding.theme.fontFamily).toBe("Poppins");
  });

  it("supports richer future nested branding", () => {
    const payload = normalizeBrandingApiResponse({
      data: {
        name: "Nested Brand",
        slug: "nested-brand",
        branding: {
          primaryColor: "#111111",
          theme: {
            primaryColor: "#445566",
            secondaryColor: "#223344",
          },
          app: {
            splashColor: "#334455",
          },
          checkout: {
            successColor: "#00AA44",
          },
          assets: {
            logoUrl: "https://example.com/logo.png",
          },
          logo: {
            light: "https://example.com/light.png",
          },
        },
      },
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe("#445566");
    expect(payload.restaurant.branding.theme.secondaryColor).toBe("#223344");
    expect(payload.restaurant.branding.app.splashColor).toBe("#334455");
    expect(payload.restaurant.branding.checkout.successColor).toBe("#00AA44");
    expect(payload.restaurant.branding.assets.logoUrl).toBe("https://example.com/logo.png");
    expect(payload.restaurant.branding.logo.light).toBe("https://example.com/light.png");
  });

  it("missing backend fields fall back to defaults", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        name: "Partial Restaurant",
        slug: "partial-restaurant",
        branding: {
          primaryColor: "#123456",
        },
      },
      message: "ok",
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe("#123456");
    expect(payload.restaurant.branding.theme.accentColor).toBe(defaultTheme.accentColor);
    expect(payload.restaurant.branding.app.homeLayout).toBe(defaultRestaurant.branding.app.homeLayout);
    expect(payload.restaurant.supportContact.email).toBe(defaultRestaurant.supportContact.email);
  });

  it("null logoUrl and coverImage fall back to defaults", () => {
    const payload = normalizeBrandingApiResponse({
      success: true,
      data: {
        name: "Null Asset Restaurant",
        slug: "null-asset-restaurant",
        logoUrl: null,
        coverImage: null,
      },
      message: "ok",
    });

    expect(payload.restaurant.logoUrl).toBe(defaultRestaurant.logoUrl);
    expect(payload.restaurant.coverImage).toBe(defaultRestaurant.coverImage);
  });

  it("buildRestaurantBrandingPatchPayload returns direct restaurant patch shape", () => {
    const payload = normalizeBrandingPayload({
      restaurant: {
        id: "restaurant-1",
        tenantId: "tenant-1",
        name: "Patch Restaurant",
        slug: "patch-restaurant",
        customDomain: "orders.example.com",
        settings: { printing: { enabled: true } },
        branding: {
          theme: {
            primaryColor: "#112233",
            secondaryColor: "#445566",
            fontFamily: "Poppins",
          },
        },
      },
    });
    const patchPayload = buildRestaurantBrandingPatchPayload(payload);

    expect(patchPayload.name).toBe("Patch Restaurant");
    expect(patchPayload.slug).toBe("patch-restaurant");
    expect(patchPayload.customDomain).toBe("orders.example.com");
    expect("restaurant" in patchPayload).toBe(false);
  });

  it("patch payload contains flattened branding primaryColor secondaryColor and fontFamily", () => {
    const payload = normalizeBrandingPayload({
      restaurant: {
        branding: {
          theme: {
            primaryColor: "#112233",
            secondaryColor: "#445566",
            fontFamily: "Poppins",
          },
        },
      },
    });
    const patchPayload = buildRestaurantBrandingPatchPayload(payload);

    expect(patchPayload.branding.primaryColor).toBe("#112233");
    expect(patchPayload.branding.secondaryColor).toBe("#445566");
    expect(patchPayload.branding.fontFamily).toBe("Poppins");
  });

  it("patch payload contains nested branding theme app checkout assets and logo", () => {
    const patchPayload = buildRestaurantBrandingPatchPayload(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);

    expect(patchPayload.branding.theme).toEqual(defaultRestaurant.branding.theme);
    expect(patchPayload.branding.app).toEqual(defaultRestaurant.branding.app);
    expect(patchPayload.branding.checkout).toEqual(defaultRestaurant.branding.checkout);
    expect(patchPayload.branding.assets).toEqual(defaultRestaurant.branding.assets);
    expect(patchPayload.branding.logo).toEqual(defaultRestaurant.branding.logo);
  });

  it("patch payload does not include read-only fields or settings", () => {
    const patchPayload = buildRestaurantBrandingPatchPayload(
      normalizeBrandingPayload({
        restaurant: {
          id: "restaurant-1",
          tenantId: "tenant-1",
          settings: { customerApp: { enabled: true } },
        },
      }),
    );

    expect("id" in patchPayload).toBe(false);
    expect("tenantId" in patchPayload).toBe(false);
    expect("createdAt" in patchPayload).toBe(false);
    expect("updatedAt" in patchPayload).toBe(false);
    expect("deletedAt" in patchPayload).toBe(false);
    expect("_count" in patchPayload).toBe(false);
    expect("deletionState" in patchPayload).toBe(false);
    expect("tenant" in patchPayload).toBe(false);
    expect("settings" in patchPayload).toBe(false);
  });
});
