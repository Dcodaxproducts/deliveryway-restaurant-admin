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
        paymentOptions: { selected: "PAYPAL" },
      })
    ).toBe("PAYPAL");
  });

  it("formats known and unknown payment methods", () => {
    expect(formatPaymentMethod("PAYPAL")).toBe("PayPal");
    expect(formatPaymentMethod("STRIPE")).toBe("Stripe online payment");
    expect(formatPaymentMethod("CARD_ON_DELIVERY")).toBe("Card on delivery");
    expect(formatPaymentMethod("BANK_TRANSFER")).toBe("Bank transfer");
    expect(formatPaymentMethod("CUSTOM_GATEWAY")).toBe("Custom Gateway");
  });

  it("formats the structured delivery address in customer-entered order", () => {
    expect(
      formatDeliveryAddress({
        street: "Ghauri Town Phase 5",
        area: "Ghauri Town Phase 5",
        postalCode: "46330",
        city: "Zone IV",
        state: "Islamabad Capital Territory",
        country: "Pakistan",
      })
    ).toBe(
      "Ghauri Town Phase 5, 46330, Zone IV, Islamabad Capital Territory\nPakistan"
    );
  });

  it("places house number between street and postal code", () => {
    expect(
      formatDeliveryAddress({
        street: "Ghauri Town",
        houseNumber: "House 12",
        postalCode: "46330",
        city: "Islamabad",
        state: "Islamabad",
        country: "Pakistan",
      })
    ).toBe(
      "Ghauri Town, House 12, 46330, Islamabad\nPakistan"
    );
  });

  it("orders structured address as street, shop number, postal code, city, then remaining parts", () => {
    expect(
      formatDeliveryAddress({
        address: "Near main gate",
        street: "Main Boulevard",
        shopNumber: "Shop 7",
        postalCode: "54000",
        city: "Lahore",
        area: "Gulberg",
        state: "Punjab",
        country: "Pakistan",
      })
    ).toBe(
      "Main Boulevard, Shop 7, 54000, Lahore\nGulberg, Punjab, Pakistan, Near main gate"
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
