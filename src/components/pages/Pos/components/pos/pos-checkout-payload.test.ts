import { describe, expect, it } from "vitest";

import {
  buildPosCheckoutPayload,
  hasGuestDeliveryAddress,
  normalizePosCustomer,
} from "./pos-checkout-payload";

describe("pos checkout payload", () => {
  it("builds registered customer checkout payload without guest fields", () => {
    const payload = buildPosCheckoutPayload({
      customer: { id: "customer-1", isGuest: false },
      orderType: "TAKEAWAY",
      paymentMethod: "cod",
      orderTime: "2026-06-19T05:54:29.267Z",
    });

    expect(payload).toEqual({
      orderTime: "2026-06-19T05:54:29.267Z",
      paymentMethod: "COD",
    });
  });

  it("adds guest contact for guest takeaway checkout", () => {
    const payload = buildPosCheckoutPayload({
      customer: {
        id: "guest-1",
        email: " guest@example.com ",
        phone: " +49123456789 ",
        isGuest: true,
      },
      orderType: "TAKEAWAY",
      paymentMethod: "COD",
      orderTime: null,
      customerNote: " ring bell ",
    });

    expect(payload).toEqual({
      orderTime: null,
      paymentMethod: "COD",
      customerNote: "ring bell",
      guestContact: {
        email: "guest@example.com",
        phone: "+49123456789",
        privacyPolicyAccepted: true,
      },
    });
  });

  it("adds guest delivery address only for guest delivery checkout", () => {
    const payload = buildPosCheckoutPayload({
      customer: {
        id: "guest-1",
        email: "guest@example.com",
        phone: "+49123456789",
        isGuest: true,
      },
      orderType: "DELIVERY",
      paymentMethod: "COD",
      guestDeliveryAddress: {
        street: " Main Street 1 ",
        area: "12",
        postalCode: " 12345 ",
        city: " Berlin ",
        state: "Berlin",
        country: " Germany ",
        lat: "52.5200",
        lng: "13.4050",
      },
    });

    expect(payload.guestDeliveryAddress).toEqual({
      street: "Main Street 1",
      area: "12",
      postalCode: "12345",
      city: "Berlin",
      state: "Berlin",
      country: "Germany",
      lat: "52.5200",
      lng: "13.4050",
    });
  });

  it("adds backend-supported checkout options when provided", () => {
    const payload = buildPosCheckoutPayload({
      customer: { id: "customer-1", isGuest: false },
      orderType: "DINE_IN",
      paymentMethod: "wallet",
      orderTime: "2026-06-19T05:54:29.267Z",
      walletAmount: 20,
      loyaltyPoints: 100,
      tipAmount: 2.5,
      customerNote: " near window ",
    });

    expect(payload).toEqual({
      orderTime: "2026-06-19T05:54:29.267Z",
      paymentMethod: "WALLET",
      walletAmount: 20,
      loyaltyPoints: 100,
      tipAmount: 2.5,
      customerNote: "near window",
    });
  });

  it("normalizes admin customer detail profile fields", () => {
    expect(
      normalizePosCustomer({
        id: "customer-1",
        email: "customer@example.com",
        isGuest: true,
        profile: {
          firstName: "Ada",
          lastName: "Lovelace",
          phone: "+49123456789",
        },
      }),
    ).toEqual({
      id: "customer-1",
      firstName: "Ada",
      lastName: "Lovelace",
      name: "",
      email: "customer@example.com",
      phone: "+49123456789",
      isGuest: true,
      profile: {
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "+49123456789",
      },
    });
  });

  it("requires guest delivery address fields and coordinates", () => {
    expect(
      hasGuestDeliveryAddress({
        street: "Main Street 1",
        postalCode: "12345",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "52.5200",
        lng: "13.4050",
      }),
    ).toBe(true);

    expect(
      hasGuestDeliveryAddress({
        street: "Main Street 1",
        postalCode: "",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "52.5200",
        lng: "13.4050",
      }),
    ).toBe(false);
  });

  it("requires valid guest delivery latitude and longitude", () => {
    expect(
      hasGuestDeliveryAddress({
        street: "Main Street 1",
        postalCode: "12345",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "",
        lng: "13.4050",
      }),
    ).toBe(false);

    expect(
      hasGuestDeliveryAddress({
        street: "Main Street 1",
        postalCode: "12345",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "91",
        lng: "13.4050",
      }),
    ).toBe(false);

    expect(
      hasGuestDeliveryAddress({
        street: "Main Street 1",
        postalCode: "12345",
        city: "Berlin",
        state: "Berlin",
        country: "Germany",
        lat: "52.5200",
        lng: "181",
      }),
    ).toBe(false);
  });
});
