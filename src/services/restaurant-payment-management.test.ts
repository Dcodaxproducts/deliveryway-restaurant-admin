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

  it("normalizes the nested restaurant payment management response", () => {
    const result = normalizeRestaurantPaymentManagement({
      data: {
        restaurantId: "restaurant-1",
        payments: {
          currency: "EUR",
          methods: {
            activePlatformMethods: [
              "COD",
              "CARD_ON_DELIVERY",
              "STRIPE",
              "PAYPAL",
              "JAZZCASH",
            ],
            restaurantMethods: {
              allowedPaymentMethods: ["COD", "PAYPAL", "WALLET"],
              walletEnabled: true,
              note: "Allow wallet",
            },
          },
          stripe: {
            accountId: "acct_123",
            payoutsEnabled: true,
            chargesEnabled: true,
            configured: true,
          },
          payouts: {
            provider: "stripe",
            enabled: true,
            lastTransfer: {
              id: "transfer-1",
            },
          },
          wallet: {
            type: "CUSTOMER_WALLET_EXPOSURE",
            accountCount: 4,
            totalBalance: 50,
          },
          summary: {
            transactionCount: 111,
            estimatedAvailableBalance: 42.39,
          },
        },
        transactions: [
          {
            id: "payment-1",
            paymentMethod: "COD",
            type: "CHARGE",
            status: "PENDING",
            amount: "21.39",
            currency: "EUR",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      restaurantId: "restaurant-1",
      activePlatformPaymentMethods: [
        "COD",
        "CARD_ON_DELIVERY",
        "STRIPE",
        "PAYPAL",
        "JAZZCASH",
      ],
      allowedPaymentMethods: ["COD", "PAYPAL", "WALLET"],
      walletEnabled: true,
      paymentMethodsNote: "Allow wallet",
      estimatedAvailableBalance: 42.39,
      currency: "EUR",
      stripeAccount: {
        accountId: "acct_123",
        configured: true,
      },
      walletExposure: {
        accountCount: 4,
        totalBalance: 50,
      },
      lastTransfer: {
        id: "transfer-1",
      },
      recentLedger: [
        {
          id: "payment-1",
          paymentMethod: "COD",
          amount: 21.39,
          currency: "EUR",
        },
      ],
    });
  });
});
