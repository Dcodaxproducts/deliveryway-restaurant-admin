import { describe, expect, it } from "vitest";

import {
  buildBranchPatchPayload,
  buildSafeBranchSettings,
  getBranchSettingsValidationError,
  getDeliveryConfigValidationError,
  hydrateBranchForEdit,
  normalizeDeliveryConfigForApi,
} from "@/components/pages/branches/forms/EditBranchForm/edit-branch.mapper";

const validPostalDeliveryConfig = {
  mode: "POSTAL_CODE",
  radiusKm: 5,
  minOrderAmount: 0,
  deliveryFee: 150,
  isFreeDelivery: false,
  freeDeliveryThreshold: 0,
  zones: [],
  zoneBands: [],
  postalCodeRules: [
    {
      postalCode: "54000",
      deliveryFee: 250,
      minOrderAmount: 1000,
      freeDeliveryThreshold: 3000,
    },
  ],
};

describe("edit branch delivery and settings mapper", () => {
  it("normalizes postal code delivery rules with all backend amount fields", () => {
    const deliveryConfig = normalizeDeliveryConfigForApi(validPostalDeliveryConfig);

    expect(deliveryConfig.postalCodeRules).toEqual([
      {
        postalCode: "54000",
        deliveryFee: 250,
        minOrderAmount: 1000,
        freeDeliveryThreshold: 3000,
      },
    ]);
  });

  it("rejects duplicate postal code rules during edit validation", () => {
    const deliveryConfig = normalizeDeliveryConfigForApi({
      ...validPostalDeliveryConfig,
      postalCodeRules: [
        validPostalDeliveryConfig.postalCodeRules[0],
        {
          ...validPostalDeliveryConfig.postalCodeRules[0],
          postalCode: " 54000 ",
        },
      ],
    });

    expect(getDeliveryConfigValidationError(deliveryConfig)).toContain("duplicates");
  });

  it("rejects negative postal code delivery amounts during edit validation", () => {
    const deliveryConfig = normalizeDeliveryConfigForApi({
      ...validPostalDeliveryConfig,
      postalCodeRules: [
        {
          postalCode: "54000",
          deliveryFee: 0,
          minOrderAmount: -1,
          freeDeliveryThreshold: 0,
        },
      ],
    });

    expect(getDeliveryConfigValidationError(deliveryConfig)).toBe(
      "Postal code rule 1 minimum order cannot be negative"
    );
  });

  it("validates table reservation settings from min table count", () => {
    expect(
      getBranchSettingsValidationError({
        tableReservationsEnabled: true,
        tableCount: 0,
      })
    ).toBe("Table count must be at least 1 when table reservations are enabled");

    expect(
      getBranchSettingsValidationError({
        tableReservationsEnabled: false,
        tableCount: 0,
      })
    ).toBeNull();
  });

  it("preserves existing settings and includes new table reservation fields in branch payload", () => {
    const deliveryConfig = normalizeDeliveryConfigForApi(validPostalDeliveryConfig);
    const settings = buildSafeBranchSettings(
      {
        allowedOrderTypes: ["DELIVERY"],
        allowedPaymentMethods: ["COD"],
        customSetting: "keep-me",
        tableReservationsEnabled: true,
        tableReservationAutoAccept: true,
        tableCount: 12,
      },
      deliveryConfig
    );

    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        isMain: false,
        address: {
          street: "Main",
          city: "Lahore",
          state: "Punjab",
          country: "PK",
        },
      },
      settings
    );

    expect(payload.settings).toMatchObject({
      customSetting: "keep-me",
      tableReservationsEnabled: true,
      tableReservationAutoAccept: true,
      tableCount: 12,
      deliveryConfig: {
        postalCodeRules: [
          {
            postalCode: "54000",
            deliveryFee: 250,
            minOrderAmount: 1000,
            freeDeliveryThreshold: 3000,
          },
        ],
      },
    });
  });

  it("hydrates edit data with safe defaults for missing table settings and postal rule fields", () => {
    const hydrated = hydrateBranchForEdit({
      id: "branch-1",
      settings: {
        deliveryConfig: {
          mode: "POSTAL_CODE",
          postalCodeRules: [
            {
              postalCode: "54000",
              deliveryFee: 250,
            },
          ],
        },
      },
    });

    expect(hydrated.settings?.tableReservationsEnabled).toBe(false);
    expect(hydrated.settings?.tableReservationAutoAccept).toBe(false);
    expect(hydrated.settings?.tableCount).toBe(0);
    expect(hydrated.settings?.deliveryConfig?.postalCodeRules).toEqual([
      {
        postalCode: "54000",
        deliveryFee: 250,
        minOrderAmount: 0,
        freeDeliveryThreshold: 0,
      },
    ]);
  });
});
