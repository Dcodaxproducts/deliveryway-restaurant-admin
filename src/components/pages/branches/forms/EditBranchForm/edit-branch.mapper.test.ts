import { describe, expect, it } from "vitest";

import {
  buildBranchPatchPayload,
  buildServiceChargeSettingsPayload,
  buildSafeBranchSettings,
  getBranchSettingsValidationError,
  getDeliveryConfigValidationError,
  hydrateBranchForEdit,
  normalizeDeliveryConfigForApi,
  normalizeServiceChargeForApi,
  sanitizeBranchSettingsForPatch,
} from "@/components/pages/branches/forms/EditBranchForm/edit-branch.mapper";
import { DEFAULT_ALLOWED_PAYMENT_METHODS } from "@/components/pages/branches/forms/EditBranchForm/edit-branch.defaults";

const validPostalDeliveryConfig = {
  mode: "POSTAL_CODE" as const,
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
      allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
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

  it("preserves existing settings while updating only service charge", () => {
    const settings = buildServiceChargeSettingsPayload(
      {
        allowedOrderTypes: ["DELIVERY", "TAKEAWAY"],
        allowedPaymentMethods: ["COD"],
        customSetting: "keep-me",
        deliveryConfig: validPostalDeliveryConfig,
        automation: {
          autoAcceptOrders: true,
          estimatedPrepTime: 20,
        },
        taxation: {
          taxPercentage: 15,
        },
        tableReservationsEnabled: true,
        tableReservationAutoAccept: true,
        tableCount: 8,
      },
      {
        isEnabled: true,
        type: "PERCENTAGE",
        value: 10,
      }
    );

    expect(settings).toMatchObject({
      allowedOrderTypes: ["DELIVERY", "TAKEAWAY"],
      allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
      customSetting: "keep-me",
      deliveryConfig: validPostalDeliveryConfig,
      automation: {
        autoAcceptOrders: true,
        estimatedPrepTime: 20,
      },
      taxation: {
        taxPercentage: 15,
      },
      tableReservationsEnabled: true,
      tableReservationAutoAccept: true,
      tableCount: 8,
      serviceCharge: {
        isEnabled: true,
        type: "PERCENTAGE",
        value: 10,
      },
    });
  });

  it("removes working-hours-only properties from branch settings patch payloads", () => {
    const settings = sanitizeBranchSettingsForPatch({
      allowedOrderTypes: ["DELIVERY"],
      openingHours: [{ dayOfWeek: "MONDAY" }],
      openingsHours: [{ dayOfWeek: "TUESDAY" }],
      holidayRanges: [{ fromDate: "2026-01-01" }],
      temporaryClosure: { isClosed: true },
      customSetting: "keep-me",
    });

    expect(settings).toEqual({
      allowedOrderTypes: ["DELIVERY"],
      customSetting: "keep-me",
    });
  });

  it("keeps delivery, table, and tax settings in full settings payload", () => {
    const deliveryConfig = normalizeDeliveryConfigForApi(validPostalDeliveryConfig);
    const settings = buildSafeBranchSettings(
      {
        allowedOrderTypes: ["DELIVERY"],
        allowedPaymentMethods: ["COD"],
        deliveryConfig,
        tableReservationsEnabled: true,
        tableReservationAutoAccept: false,
        tableCount: 5,
        taxation: {
          taxPercentage: 7.5,
        },
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 100,
        },
      },
      deliveryConfig
    );

    expect(settings).toMatchObject({
      allowedOrderTypes: ["DELIVERY"],
      allowedPaymentMethods: DEFAULT_ALLOWED_PAYMENT_METHODS,
      deliveryConfig,
      tableReservationsEnabled: true,
      tableReservationAutoAccept: false,
      tableCount: 5,
      taxation: {
        taxPercentage: 7.5,
      },
      serviceCharge: {
        isEnabled: true,
        type: "AMOUNT",
        value: 100,
      },
    });
  });

  it("validates service charge settings during edit", () => {
    expect(
      getBranchSettingsValidationError({
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 101,
        },
      })
    ).toBe("Percentage service charge cannot exceed 100");

    expect(
      getBranchSettingsValidationError({
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 0,
        },
      })
    ).toBe("Service charge value must be greater than 0 when enabled");

    expect(
      getBranchSettingsValidationError({
        serviceCharge: {
          isEnabled: false,
          type: "PERCENTAGE",
          value: 0,
        },
      })
    ).toBeNull();
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
        } as unknown as typeof validPostalDeliveryConfig,
      },
    });

    expect(hydrated.settings?.tableReservationsEnabled).toBe(false);
    expect(hydrated.settings?.tableReservationAutoAccept).toBe(false);
    expect(hydrated.settings?.tableCount).toBe(0);
    expect(hydrated.settings?.serviceCharge).toEqual({
      isEnabled: false,
      type: "PERCENTAGE",
      value: 0,
    });
    expect(hydrated.settings?.deliveryConfig?.postalCodeRules).toEqual([
      {
        postalCode: "54000",
        deliveryFee: 250,
        minOrderAmount: 0,
        freeDeliveryThreshold: 0,
      },
    ]);
  });

  it("normalizes missing and disabled service charge defaults", () => {
    expect(normalizeServiceChargeForApi(undefined)).toEqual({
      isEnabled: false,
      type: "PERCENTAGE",
      value: 0,
    });

    expect(
      normalizeServiceChargeForApi({
        isEnabled: false,
        type: "AMOUNT",
        value: 100,
      })
    ).toEqual({
      isEnabled: false,
      type: "PERCENTAGE",
      value: 0,
    });
  });
});
