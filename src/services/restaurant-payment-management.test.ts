import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getRestaurantPaymentManagement,
  normalizeRestaurantPaymentManagement,
  updateRestaurantPaymentMethods,
} from "@/services/restaurant-payment-management";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedHttpClient = vi.mocked(httpClient);

describe("restaurant payment management service", () => {
  beforeEach(() => {
    mockedHttpClient.get.mockReset();
    mockedHttpClient.patch.mockReset();
  });

  it("GET calls the restaurant payment management endpoint", async () => {
    mockedHttpClient.get.mockResolvedValueOnce({
      data: {
        restaurantId: "restaurant-1",
        activePlatformPaymentMethods: ["COD", "STRIPE"],
        configuredPaymentMethods: {
          allowedPaymentMethods: ["COD"],
          walletEnabled: false,
        },
      },
    });

    await getRestaurantPaymentManagement("restaurant-1");

    expect(mockedHttpClient.get).toHaveBeenCalledWith(
      "/payments/restaurants/restaurant-1/management"
    );
  });

  it("PATCH updates restaurant payment methods", async () => {
    mockedHttpClient.patch.mockResolvedValueOnce({ data: { success: true } });

    await updateRestaurantPaymentMethods("restaurant-1", {
      allowedPaymentMethods: ["COD", "STRIPE", "WALLET"],
      walletEnabled: true,
      note: "Allow cash, Stripe, and wallet",
    });

    expect(mockedHttpClient.patch).toHaveBeenCalledWith(
      "/payments/restaurants/restaurant-1/methods",
      {
        allowedPaymentMethods: ["COD", "STRIPE", "WALLET"],
        walletEnabled: true,
        note: "Allow cash, Stripe, and wallet",
      }
    );
  });

  it("normalizes management summary from flexible backend fields", () => {
    const result = normalizeRestaurantPaymentManagement({
      data: {
        restaurantId: "restaurant-1",
        activePlatformPaymentMethods: ["COD", "STRIPE", "UNSUPPORTED"],
        configuredPaymentMethods: {
          allowedPaymentMethods: ["COD", "WALLET"],
          walletEnabled: true,
        },
        estimatedAvailableBalance: "1250.50",
        currency: "PKR",
        customerWalletExposure: {
          totalExposure: "300",
        },
        stripeAccount: {
          accountId: "acct_123",
          payoutsEnabled: true,
          lastTransfer: {
            id: "transfer-1",
          },
        },
        recentLedger: [
          {
            id: "payment-1",
            type: "CHARGE",
            status: "PAID",
            paymentMethod: "STRIPE",
            amount: "1250.50",
            currency: "PKR",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      restaurantId: "restaurant-1",
      activePlatformPaymentMethods: ["COD", "STRIPE"],
      allowedPaymentMethods: ["COD", "WALLET"],
      walletEnabled: true,
      estimatedAvailableBalance: 1250.5,
      currency: "PKR",
      lastTransfer: {
        id: "transfer-1",
      },
      recentLedger: [
        {
          id: "payment-1",
          type: "CHARGE",
          status: "PAID",
          paymentMethod: "STRIPE",
          amount: 1250.5,
          currency: "PKR",
        },
      ],
    });
  });
});
