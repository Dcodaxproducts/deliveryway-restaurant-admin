import { describe, expect, it } from "vitest";

import { PAYMENT_METHOD_CODES } from "@/types/payment-methods";
import { createBranchSchema } from "@/validations/branches";

const createBranchPayload = {
  name: "Blue Area",
  isMain: false,
  branchAdmin: {},
  street: "Street 12",
  city: "Lahore",
  state: "Punjab",
  country: "Pakistan",
  lat: "31.5204",
  lng: "74.3587",
};

describe("branch service charge validation", () => {
  it("accepts backend-supported branch address fields on create", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      street: "Street 12",
      shopNumber: "Shop 4",
      postalCode: "54000",
      city: "Lahore",
      state: "Punjab",
      country: "Pakistan",
      lat: "31.5204",
      lng: "74.3587",
    });

    expect(result.success).toBe(true);
  });

  it("accepts all backend-supported branch payment methods", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        allowedPaymentMethods: [...PAYMENT_METHOD_CODES],
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts percentage service charge", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 10,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts amount service charge", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 100,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects enabled percentage service charge above 100", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 101,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects enabled percentage service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects enabled amount service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts disabled service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: false,
          type: "PERCENTAGE",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires a complete branch location", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      street: "",
      lat: "",
      lng: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires identity fields when an optional branch admin is started", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      branchAdmin: { email: "manager@example.com" },
    });

    expect(result.success).toBe(false);
  });
});
