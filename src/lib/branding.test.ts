import { describe, expect, it } from "vitest";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import {
  brandingPayloadToCssVariables,
  getBrandingStorageKey,
  getReadableTextColor,
  normalizeBrandingApiResponse,
  normalizeBrandingPayload,
} from "@/lib/branding";

const defaultTheme = DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding.theme;

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

  it("builds storage key with restaurant id and default key without id", () => {
    expect(getBrandingStorageKey()).toBe("deliveryway:restaurant-branding");
    expect(getBrandingStorageKey("restaurant-123")).toBe("deliveryway:restaurant-branding:restaurant-123");
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

  it("normalizes API response with data as restaurant fields", () => {
    const payload = normalizeBrandingApiResponse({
      data: {
        name: "Data Restaurant",
        slug: "data-restaurant",
      },
    });

    expect(payload.restaurant.name).toBe("Data Restaurant");
    expect(payload.restaurant.slug).toBe("data-restaurant");
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

  it("preserves nested API branding primaryColor", () => {
    const payload = normalizeBrandingApiResponse({
      data: {
        restaurant: {
          name: "Nested Brand",
          slug: "nested-brand",
          branding: {
            theme: {
              primaryColor: "#445566",
            },
          },
        },
      },
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe("#445566");
    expect(payload.restaurant.branding.theme.secondaryColor).toBe(defaultTheme.secondaryColor);
  });

  it("preserves flattened API branding primaryColor", () => {
    const payload = normalizeBrandingApiResponse({
      restaurant: {
        name: "Flat Brand",
        slug: "flat-brand",
        branding: {
          primaryColor: "#778899",
        },
      },
    });

    expect(payload.restaurant.branding.theme.primaryColor).toBe("#778899");
  });
});
