import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/lib/axios";
import {
  getPaymentMethods,
  PAYMENT_METHODS_ENDPOINT,
} from "@/services/payment-methods";
import { normalizePaymentMethodsResponse } from "@/types/payment-methods";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(httpClient.get);

describe("payment methods service", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("GET calls global payment methods endpoint without api prefix duplication", async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        { code: "COD", label: "Cash on delivery", isActive: true },
      ],
      message: "Payment methods fetched successfully",
    });

    await getPaymentMethods();

    expect(mockedGet).toHaveBeenCalledWith(PAYMENT_METHODS_ENDPOINT);
    expect(PAYMENT_METHODS_ENDPOINT).toBe(
      "/admin/global-settings/payment-methods"
    );
    expect(PAYMENT_METHODS_ENDPOINT).not.toContain("/api/v1");
  });

  it("normalizes valid response", () => {
    const result = normalizePaymentMethodsResponse({
      data: [
        { code: "COD", label: "Cash on delivery", isActive: true },
        { code: "PAYPAL", label: "PayPal", isActive: false },
      ],
      message: "Payment methods fetched successfully",
    });

    expect(result).toEqual({
      paymentMethods: [
        { code: "COD", label: "Cash on delivery", isActive: true },
        { code: "PAYPAL", label: "PayPal", isActive: false },
      ],
      message: "Payment methods fetched successfully",
    });
  });

  it("handles missing data safely", () => {
    expect(normalizePaymentMethodsResponse({ message: "No data" })).toEqual({
      paymentMethods: [],
      message: "No data",
    });
    expect(normalizePaymentMethodsResponse(null)).toEqual({
      paymentMethods: [],
      message: undefined,
    });
  });

  it("skips invalid payment method codes", () => {
    const result = normalizePaymentMethodsResponse({
      data: [
        { code: "COD", label: "Cash on delivery", isActive: true },
        { code: "CARD_ON_DELIVERY", label: "Card on delivery", isActive: true },
        { code: "PAYPAL", label: "PayPal", isActive: true },
        { code: "STRIPE", label: "Stripe", isActive: false },
        { code: "EASYPAISA", label: "Easypaisa", isActive: true },
        { code: "JAZZCASH", label: "JazzCash", isActive: true },
        { code: "BANK_TRANSFER", label: "Bank transfer", isActive: false },
        { code: "WALLET", label: "Customer wallet", isActive: true },
        { code: "UNSUPPORTED_GATEWAY", label: "Unsupported gateway", isActive: true },
      ],
    });

    expect(result.paymentMethods).toEqual([
      { code: "COD", label: "Cash on delivery", isActive: true },
      { code: "CARD_ON_DELIVERY", label: "Card on delivery", isActive: true },
      { code: "PAYPAL", label: "PayPal", isActive: true },
      { code: "STRIPE", label: "Stripe online payment", isActive: false },
      { code: "EASYPAISA", label: "Easypaisa", isActive: true },
      { code: "JAZZCASH", label: "JazzCash", isActive: true },
      { code: "BANK_TRANSFER", label: "Bank transfer", isActive: false },
      { code: "WALLET", label: "Customer wallet", isActive: true },
    ]);
  });

  it("preserves active and inactive status", () => {
    const result = normalizePaymentMethodsResponse({
      data: [
        { code: "PAYPAL", label: "PayPal", isActive: false },
        { code: "STRIPE", label: "Online card", isActive: true },
      ],
    });

    expect(result.paymentMethods).toEqual([
      { code: "PAYPAL", label: "PayPal", isActive: false },
      { code: "STRIPE", label: "Stripe online payment", isActive: true },
    ]);
  });
});
