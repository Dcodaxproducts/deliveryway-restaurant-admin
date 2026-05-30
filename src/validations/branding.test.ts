import { describe, expect, it } from "vitest";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { optionalUrlSchema, restaurantBrandingPayloadSchema } from "@/validations/branding";

describe("branding validation", () => {
  it("valid default payload passes", () => {
    expect(restaurantBrandingPayloadSchema.safeParse(DEFAULT_RESTAURANT_BRANDING_PAYLOAD).success).toBe(true);
  });

  it("invalid hex color fails", () => {
    const payload = structuredClone(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
    payload.restaurant.branding.theme.primaryColor = "red";

    expect(restaurantBrandingPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it("valid relative asset path passes", () => {
    const payload = structuredClone(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
    payload.restaurant.branding.assets.logoUrl = "/uploads/logo.png";

    expect(restaurantBrandingPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("invalid URL fails", () => {
    const payload = structuredClone(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
    payload.restaurant.logoUrl = "ftp://example.com/logo.png";

    expect(restaurantBrandingPayloadSchema.safeParse(payload).success).toBe(false);
  });

  it("invalid theme mode fails", () => {
    const payload = structuredClone(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
    const candidate = {
      ...payload,
      restaurant: {
        ...payload.restaurant,
        branding: {
          ...payload.restaurant.branding,
          theme: {
            ...payload.restaurant.branding.theme,
            mode: "auto",
          },
        },
      },
    };

    expect(restaurantBrandingPayloadSchema.safeParse(candidate).success).toBe(false);
  });

  it("empty optional URL passes", () => {
    expect(optionalUrlSchema.safeParse("").success).toBe(true);
  });
});
