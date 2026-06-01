import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_RESTAURANT_BRANDING_PAYLOAD } from "@/config/default-branding";
import { httpClient } from "@/lib/axios";
import {
  getBrandingSettings,
  resetBrandingSettings,
  saveBrandingSettings,
} from "@/services/branding";
import type { RestaurantBrandingPatchPayload } from "@/types/branding";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);
const defaultRestaurant = DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant;

const expectNoReadOnlyPatchFields = (patchPayload: RestaurantBrandingPatchPayload) => {
  expect("id" in patchPayload).toBe(false);
  expect("tenantId" in patchPayload).toBe(false);
  expect("settings" in patchPayload).toBe(false);
  expect("tenant" in patchPayload).toBe(false);
  expect("_count" in patchPayload).toBe(false);
  expect("deletionState" in patchPayload).toBe(false);
  expect("createdAt" in patchPayload).toBe(false);
  expect("updatedAt" in patchPayload).toBe(false);
};

describe("branding service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBrandingSettings", () => {
    it("missing restaurantId returns defaults and does not call backend", async () => {
      const result = await getBrandingSettings("  ");

      expect(result).toEqual(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
      expect(mockedHttpClient.get).not.toHaveBeenCalled();
      expect(mockedHttpClient.patch).not.toHaveBeenCalled();
    });

    it("restaurantId calls GET /restaurants/:restaurantId", async () => {
      mockedHttpClient.get.mockResolvedValueOnce({
        data: {
          name: "GET Restaurant",
          slug: "get-restaurant",
        },
      });

      await getBrandingSettings("restaurant-1");

      expect(mockedHttpClient.get).toHaveBeenCalledWith("/restaurants/restaurant-1");
    });

    it("branch admin source calls GET /customer-app/home with restaurantId params", async () => {
      mockedHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          restaurant: {
            id: "restaurant-1",
            name: "Branch Visible Restaurant",
            slug: "branch-visible-restaurant",
          },
          config: {
            branding: {
              theme: {
                primaryColor: "#2000C2",
              },
            },
          },
        },
      });

      const result = await getBrandingSettings(" restaurant-1 ", { source: "customer-home" });

      expect(mockedHttpClient.get).toHaveBeenCalledWith("/customer-app/home", {
        params: { restaurantId: "restaurant-1" },
      });
      expect(result.restaurant.name).toBe("Branch Visible Restaurant");
      expect(result.restaurant.branding.theme.primaryColor).toBe("#2000C2");
    });

    it("GET normalizes backend envelope", async () => {
      mockedHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          id: "restaurant-1",
          tenantId: "tenant-1",
          name: "Envelope Restaurant",
          slug: "envelope-restaurant",
          customDomain: "orders.example.com",
          branding: {
            primaryColor: "#E4002B",
          },
        },
        message: "Restaurant fetched",
      });

      const result = await getBrandingSettings("restaurant-1");

      expect(result.restaurant.id).toBe("restaurant-1");
      expect(result.restaurant.tenantId).toBe("tenant-1");
      expect(result.restaurant.name).toBe("Envelope Restaurant");
      expect(result.restaurant.slug).toBe("envelope-restaurant");
      expect(result.restaurant.customDomain).toBe("orders.example.com");
      expect(result.restaurant.branding.theme.primaryColor).toBe("#E4002B");
    });
  });

  describe("saveBrandingSettings", () => {
    it("missing restaurantId returns normalized payload and does not call PATCH", async () => {
      const result = await saveBrandingSettings(
        {
          restaurant: {
            ...defaultRestaurant,
            name: "Local Restaurant",
            slug: "local-restaurant",
            branding: {
              ...defaultRestaurant.branding,
              theme: {
                ...defaultRestaurant.branding.theme,
                primaryColor: "#123456",
              },
            },
          },
        },
        null,
      );

      expect(result.restaurant.name).toBe("Local Restaurant");
      expect(result.restaurant.slug).toBe("local-restaurant");
      expect(result.restaurant.branding.theme.primaryColor).toBe("#123456");
      expect(mockedHttpClient.patch).not.toHaveBeenCalled();
    });

    it("restaurantId calls PATCH /restaurants/:restaurantId with direct restaurant fields", async () => {
      mockedHttpClient.patch.mockResolvedValueOnce({
        data: {
          name: "Patch Restaurant",
          slug: "patch-restaurant",
          branding: {
            primaryColor: "#112233",
          },
        },
      });

      await saveBrandingSettings(
        {
          restaurant: {
            ...defaultRestaurant,
            id: "restaurant-1",
            tenantId: "tenant-1",
            customDomain: "orders.patch.example.com",
            settings: { printing: { enabled: true } },
            name: "Patch Restaurant",
            slug: "patch-restaurant",
            logoUrl: "https://cdn.example.com/logo.png",
            coverImage: "https://cdn.example.com/cover.png",
            tagline: "Patch tagline",
            bio: "Patch bio",
            supportContact: {
              email: "support@patch.example.com",
              phone: "+10000000000",
              whatsapp: "+19999999999",
              address: "Hidden address",
            },
            socialMedia: {
              website: "https://patch.example.com",
              facebook: "https://facebook.com/patch",
              instagram: "https://instagram.com/patch",
            },
            branding: {
              ...defaultRestaurant.branding,
              theme: {
                ...defaultRestaurant.branding.theme,
                primaryColor: "#112233",
              },
            },
          },
        },
        "restaurant-1",
      );

      expect(mockedHttpClient.patch).toHaveBeenCalledTimes(1);
      const [endpoint, patchPayloadArgument] = mockedHttpClient.patch.mock.calls[0];
      const patchPayload = patchPayloadArgument as RestaurantBrandingPatchPayload;

      expect(endpoint).toBe("/restaurants/restaurant-1");
      expect("restaurant" in patchPayload).toBe(false);
      expect(patchPayload).toMatchObject({
        name: "Patch Restaurant",
        slug: "patch-restaurant",
        logoUrl: "https://cdn.example.com/logo.png",
        coverImage: "https://cdn.example.com/cover.png",
        customDomain: "orders.patch.example.com",
        tagline: "Patch tagline",
        bio: "Patch bio",
        supportContact: {
          email: "support@patch.example.com",
          phone: "+10000000000",
          whatsapp: "+19999999999",
        },
        socialMedia: {
          website: "https://patch.example.com",
          facebook: "https://facebook.com/patch",
          instagram: "https://instagram.com/patch",
        },
        branding: {
          primaryColor: "#112233",
          theme: expect.any(Object),
          app: expect.any(Object),
          checkout: expect.any(Object),
          assets: expect.any(Object),
          logo: expect.any(Object),
        },
      });
      expectNoReadOnlyPatchFields(patchPayload);
    });
  });

  describe("resetBrandingSettings", () => {
    it("missing restaurantId returns defaults and does not call backend", async () => {
      const result = await resetBrandingSettings(undefined);

      expect(result).toEqual(DEFAULT_RESTAURANT_BRANDING_PAYLOAD);
      expect(mockedHttpClient.get).not.toHaveBeenCalled();
      expect(mockedHttpClient.patch).not.toHaveBeenCalled();
    });

    it("gets current restaurant first then patches preserved identity with default branding only", async () => {
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
          branding: {
            ...DEFAULT_RESTAURANT_BRANDING_PAYLOAD.restaurant.branding,
            brandVersion: "v2",
            customTokens: { badgeRadius: "20px" },
          },
        },
      });

      await resetBrandingSettings("restaurant-1");

      expect(mockedHttpClient.get).toHaveBeenCalledBefore(mockedHttpClient.patch);
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
          primaryColor: defaultRestaurant.branding.theme.primaryColor,
          secondaryColor: defaultRestaurant.branding.theme.secondaryColor,
          accentColor: defaultRestaurant.branding.theme.accentColor,
          backgroundColor: defaultRestaurant.branding.theme.backgroundColor,
          textColor: defaultRestaurant.branding.theme.textColor,
          fontFamily: defaultRestaurant.branding.theme.fontFamily,
          theme: defaultRestaurant.branding.theme,
          app: defaultRestaurant.branding.app,
          checkout: defaultRestaurant.branding.checkout,
          assets: defaultRestaurant.branding.assets,
          logo: defaultRestaurant.branding.logo,
          brandVersion: "v2",
          customTokens: { badgeRadius: "20px" },
        },
      });
      expect("settings" in patchPayload).toBe(false);
      expectNoReadOnlyPatchFields(patchPayload);
    });
  });

  it("service endpoints use relative restaurant paths without version prefixes", async () => {
    const forbiddenPrefix = ["/api", "/v1"].join("");

    mockedHttpClient.get.mockResolvedValueOnce({ data: { name: "Endpoint", slug: "endpoint" } });
    mockedHttpClient.patch.mockResolvedValueOnce({ data: { name: "Endpoint", slug: "endpoint" } });

    await getBrandingSettings("restaurant-1");
    await saveBrandingSettings(DEFAULT_RESTAURANT_BRANDING_PAYLOAD, "restaurant-2");

    expect(mockedHttpClient.get.mock.calls[0][0]).toBe("/restaurants/restaurant-1");
    expect(mockedHttpClient.patch.mock.calls[0][0]).toBe("/restaurants/restaurant-2");
    expect(mockedHttpClient.get.mock.calls[0][0]).not.toContain(forbiddenPrefix);
    expect(mockedHttpClient.patch.mock.calls[0][0]).not.toContain(forbiddenPrefix);

    vi.clearAllMocks();
    mockedHttpClient.get.mockResolvedValueOnce({ data: { restaurant: { name: "Home" } } });

    await getBrandingSettings("restaurant-1", { source: "customer-home" });

    expect(mockedHttpClient.get.mock.calls[0][0]).toBe("/customer-app/home");
    expect(mockedHttpClient.get.mock.calls[0][0]).not.toContain(forbiddenPrefix);
  });
});
