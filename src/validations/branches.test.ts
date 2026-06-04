import { describe, expect, it } from "vitest";

import {
  BranchSettingsSchema,
  DeliveryConfigSchema,
  createBranchSchema,
} from "@/validations/branches";

const validPostalCodeRule = {
  postalCode: "54000",
  deliveryFee: 250,
  minOrderAmount: 1000,
  freeDeliveryThreshold: 3000,
};

const validBranchSettings = {
  allowedOrderTypes: ["DELIVERY"],
  allowedPaymentMethods: ["COD"],
  deliveryConfig: {
    mode: "POSTAL_CODE",
    radiusKm: 5,
    minOrderAmount: 0,
    deliveryFee: 150,
    isFreeDelivery: false,
    freeDeliveryThreshold: 0,
    zones: [],
    zoneBands: [],
    postalCodeRules: [validPostalCodeRule],
  },
  automation: {
    autoAcceptOrders: false,
    estimatedPrepTime: 30,
  },
  taxation: {
    taxPercentage: 0,
  },
  tableReservationsEnabled: true,
  tableReservationAutoAccept: true,
  tableCount: 12,
  contact: {
    phone: "",
    whatsapp: "",
  },
};

describe("branch settings validation", () => {
  it("accepts valid POSTAL_CODE delivery rules with rule amounts", () => {
    const result = BranchSettingsSchema.safeParse(validBranchSettings);

    expect(result.success).toBe(true);
    expect(result.data?.deliveryConfig.postalCodeRules[0]).toMatchObject({
      deliveryFee: 250,
      minOrderAmount: 1000,
      freeDeliveryThreshold: 3000,
    });
  });

  it("rejects POSTAL_CODE mode with empty postalCodeRules", () => {
    const result = DeliveryConfigSchema.safeParse({
      ...validBranchSettings.deliveryConfig,
      postalCodeRules: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["postalCodeRules"]);
  });

  it("rejects duplicate postal codes", () => {
    const result = DeliveryConfigSchema.safeParse({
      ...validBranchSettings.deliveryConfig,
      postalCodeRules: [
        validPostalCodeRule,
        {
          ...validPostalCodeRule,
          postalCode: " 54000 ",
          deliveryFee: 300,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["postalCodeRules", 1, "postalCode"]);
  });

  it("validates postal rule amount fields as non-negative numbers", () => {
    const result = DeliveryConfigSchema.safeParse({
      ...validBranchSettings.deliveryConfig,
      postalCodeRules: [
        {
          postalCode: "54000",
          deliveryFee: -1,
          minOrderAmount: -1,
          freeDeliveryThreshold: -1,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.at(-1))).toEqual([
      "deliveryFee",
      "minOrderAmount",
      "freeDeliveryThreshold",
    ]);
  });

  it("requires at least one table when table reservations are enabled", () => {
    const result = createBranchSchema.safeParse({
      name: "Blue Area",
      isMain: false,
      branchAdmin: {},
      settings: {
        tableReservationsEnabled: true,
        tableCount: 0,
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["settings", "tableCount"]);
  });

  it("allows tableCount 0 when table reservations are disabled", () => {
    const result = createBranchSchema.safeParse({
      name: "Blue Area",
      isMain: false,
      branchAdmin: {},
      settings: {
        tableReservationsEnabled: false,
        tableReservationAutoAccept: false,
        tableCount: 0,
      },
    });

    expect(result.success).toBe(true);
  });
});
