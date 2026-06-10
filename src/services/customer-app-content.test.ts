import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/lib/axios";
import {
  buildPrivacyPolicyPageLink,
  getCustomerAppContent,
  getPublicPrivacyPolicy,
  normalizeCustomerAppContent,
  updateCustomerAppPrivacyPolicy,
} from "@/services/customer-app-content";

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("customer app content service", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it("reads privacy policy from customerApp settings responses", () => {
    expect(
      normalizeCustomerAppContent({
        data: {
          id: "restaurant-1",
          settings: {
            customerApp: {
              privacyPolicy: "<p>Saved policy</p>",
            },
          },
        },
      }, "restaurant-1")
    ).toEqual({
      restaurantId: "restaurant-1",
      privacyPolicy: "<p>Saved policy</p>",
      title: undefined,
      policyLink: undefined,
    });
  });

  it("reads public privacy-policy responses", () => {
    expect(
      normalizeCustomerAppContent({
        data: {
          restaurantId: "restaurant-1",
          title: "Privacy Policy",
          content: "<p>Public policy</p>",
          policyLink: "/api/v1/public-content/privacy-policy?restaurantId=restaurant-1",
        },
      })
    ).toEqual({
      restaurantId: "restaurant-1",
      privacyPolicy: "<p>Public policy</p>",
      title: "Privacy Policy",
      policyLink: "/api/v1/public-content/privacy-policy?restaurantId=restaurant-1",
    });
  });

  it("calls admin and public endpoints without duplicating api version", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { privacyPolicy: "Saved" } } });
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { privacyPolicy: "Updated" } } });
    mockedApi.get.mockResolvedValueOnce({ data: { data: { content: "Public" } } });

    await getCustomerAppContent("restaurant-1");
    await updateCustomerAppPrivacyPolicy("restaurant-1", "Updated");
    await getPublicPrivacyPolicy("restaurant-1");

    expect(mockedApi.get).toHaveBeenNthCalledWith(
      1,
      "/restaurants/restaurant-1/customer-app-content"
    );
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/customer-app-content",
      { privacyPolicy: "Updated" }
    );
    expect(mockedApi.get).toHaveBeenNthCalledWith(
      2,
      "/public-content/privacy-policy",
      { params: { restaurantId: "restaurant-1" } }
    );
  });

  it("builds the public privacy policy page link", () => {
    expect(buildPrivacyPolicyPageLink()).toBe("/privacy-policy");
  });
});
