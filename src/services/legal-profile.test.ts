import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getLegalProfile,
  normalizeLegalProfileResponse,
  updateLegalProfile,
} from "@/services/legal-profile";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);

describe("legal profile service", () => {
  beforeEach(() => {
    mockedHttpClient.get.mockReset();
    mockedHttpClient.patch.mockReset();
  });

  it("normalizes nested legal profile responses", () => {
    expect(
      normalizeLegalProfileResponse({
        data: {
          restaurantId: "restaurant-1",
          legalProfile: {
            legalBusinessName: "DeliveryWays Kitchen LLC",
            taxNumber: "VAT-123",
            businessAddress: {
              street: "Street 12",
              shopNumber: "Shop 7",
              city: "Lahore",
              state: "Punjab",
              country: "Pakistan",
            },
            contractText: "Legal terms",
          },
        },
      })
    ).toEqual({
      restaurantId: "restaurant-1",
      legalBusinessName: "DeliveryWays Kitchen LLC",
      taxNumber: "VAT-123",
      businessAddress: {
        street: "Street 12",
        shopNumber: "Shop 7",
        city: "Lahore",
        state: "Punjab",
        country: "Pakistan",
      },
      contractText: "Legal terms",
    });
  });

  it("uses the legal-profile restaurant endpoint", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({ data: {} });

    await getLegalProfile("restaurant 1");

    expect(mockedHttpClient.get).toHaveBeenCalledWith(
      "/restaurants/restaurant%201/legal-profile"
    );
  });

  it("patches legal profile payload", async () => {
    const payload = {
      legalBusinessName: "DeliveryWays Kitchen LLC",
      taxNumber: "VAT-123",
      businessAddress: {
        street: "Street 12",
        shopNumber: null,
        city: "Lahore",
        state: "Punjab",
        country: "Pakistan",
      },
      contractText: "Legal terms",
    };
    mockedHttpClient.patch.mockResolvedValueOnce({ data: {} });

    await updateLegalProfile("restaurant-1", payload);

    expect(mockedHttpClient.patch).toHaveBeenCalledWith(
      "/restaurants/restaurant-1/legal-profile",
      payload
    );
  });
});
