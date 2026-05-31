import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { httpClient } from "@/lib/axios";
import { resetBrandingSettings } from "@/services/branding";
import type { RestaurantBrandingPatchPayload } from "@/types/branding";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);

describe("branding service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resetBrandingSettings gets current restaurant before patching and preserves identity fields", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({
      data: {
        id: "restaurant-1",
        tenantId: "tenant-1",
        name: "Real Restaurant",
        slug: "real-restaurant",
        logoUrl: "https://cdn.example.com/logo.png",
        coverImage: "https://cdn.example.com/cover.png",
        customDomain: "orders.real.example.com",
        tagline: "Real food",
        bio: "Real profile bio",
        settings: { printing: { enabled: true } },
        supportContact: {
          email: "support@real.example.com",
          phone: "+10000000000",
          whatsapp: "+19999999999",
          address: "123 Real Street",
        },
        socialMedia: {
          website: "https://real.example.com",
          instagram: "https://instagram.com/real",
        },
        branding: {
          primaryColor: "#111111",
          brandVersion: "v2",
          customTokens: { badgeRadius: "20px" },
        },
      },
    });
    mockedHttpClient.patch.mockResolvedValueOnce({
      data: {
        id: "restaurant-1",
        tenantId: "tenant-1",
        name: "Real Restaurant",
        slug: "real-restaurant",
        logoUrl: "https://cdn.example.com/logo.png",
        coverImage: "https://cdn.example.com/cover.png",
        customDomain: "orders.real.example.com",
        tagline: "Real food",
        bio: "Real profile bio",
        supportContact: {
          email: "support@real.example.com",
          phone: "+10000000000",
          whatsapp: "+19999999999",
        },
        socialMedia: {
          website: "https://real.example.com",
          instagram: "https://instagram.com/real",
        },
        branding: {
          ...DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding,
          brandVersion: "v2",
          customTokens: { badgeRadius: "20px" },
        },
      },
    });

    await resetBrandingSettings("restaurant-1");

    expect(mockedHttpClient.get).toHaveBeenCalledWith("/restaurants/restaurant-1");
    expect(mockedHttpClient.patch).toHaveBeenCalledTimes(1);
    const [endpoint, patchPayloadArgument] = mockedHttpClient.patch.mock.calls[0];
    const patchPayload = patchPayloadArgument as RestaurantBrandingPatchPayload;

    expect(endpoint).toBe("/restaurants/restaurant-1");
    expect(patchPayload).toMatchObject({
      name: "Real Restaurant",
      slug: "real-restaurant",
      logoUrl: "https://cdn.example.com/logo.png",
      coverImage: "https://cdn.example.com/cover.png",
      customDomain: "orders.real.example.com",
      tagline: "Real food",
      bio: "Real profile bio",
      supportContact: {
        email: "support@real.example.com",
        phone: "+10000000000",
        whatsapp: "+19999999999",
      },
      socialMedia: {
        website: "https://real.example.com",
        instagram: "https://instagram.com/real",
      },
      branding: {
        primaryColor: DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding.theme.primaryColor,
        brandVersion: "v2",
        customTokens: { badgeRadius: "20px" },
      },
    });
    expect("address" in patchPayload.supportContact).toBe(false);
    expect("settings" in patchPayload).toBe(false);
    expect("extra" in patchPayload.branding).toBe(false);
  });
});
