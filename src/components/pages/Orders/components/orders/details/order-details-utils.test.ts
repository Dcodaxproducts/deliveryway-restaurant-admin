import { describe, expect, it } from "vitest";

import {
  formatDeliveryAddress,
  formatPaymentMethod,
  getMapsUrl,
  getSelectedPaymentMethod,
} from "@/components/pages/Orders/components/orders/details/order-details-utils";

describe("order details utils", () => {
  it("prefers selected payment option over legacy paymentMethod", () => {
    expect(
      getSelectedPaymentMethod({
        paymentMethod: "COD",
        paymentOptions: { selected: "WALLET" },
      })
    ).toBe("WALLET");
  });

  it("formats known and unknown payment methods", () => {
    expect(formatPaymentMethod("WALLET")).toBe("Wallet");
    expect(formatPaymentMethod("BANK_TRANSFER")).toBe("Bank transfer");
    expect(formatPaymentMethod("CUSTOM_GATEWAY")).toBe("Custom Gateway");
  });

  it("formats the structured delivery address from the order API", () => {
    expect(
      formatDeliveryAddress({
        street:
          "Ghauri Town Phase 5, Zone IV, Islamabad Capital Territory, 46330, Pakistan",
        area: "Ghauri Town Phase 5",
        postalCode: "46330",
        city: "Zone IV",
        state: "Islamabad Capital Territory",
        country: "Pakistan",
      })
    ).toBe(
      "Ghauri Town Phase 5, Zone IV, Islamabad Capital Territory, 46330, Pakistan"
    );
  });

  it("uses legacy address text when present", () => {
    expect(formatDeliveryAddress({ address: "Front desk, Mall Road" })).toBe(
      "Front desk, Mall Road"
    );
  });

  it("builds a maps url only when coordinates are available", () => {
    expect(getMapsUrl({ lat: 33.6135745, lng: 73.1320974 })).toBe(
      "https://www.google.com/maps?q=33.6135745,73.1320974"
    );
    expect(getMapsUrl({ street: "No coordinates" })).toBeNull();
  });
});
