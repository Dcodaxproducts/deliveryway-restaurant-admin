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
import type { BranchFormData } from "@/components/pages/branches/forms/EditBranchForm/types";

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
        deliveryTime: 45,
        deliveryIntervalMinutes: 15,
        pickupIntervalMinutes: 10,
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
      deliveryTime: 45,
      deliveryIntervalMinutes: 15,
      pickupIntervalMinutes: 10,
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
      deliveryHours: [{ dayOfWeek: "WEDNESDAY" }],
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
      manager: {
        email: "branch@yopmail.com",
        profile: {
          firstName: "Wajih ul",
          lastName: "Hassan",
          phone: "12345678",
        },
      },
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
    expect(hydrated.branchAdmin).toEqual({
      email: "branch@yopmail.com",
      password: "",
      firstName: "Wajih ul",
      lastName: "Hassan",
      phone: "12345678",
    });
  });

  it("hydrates nullable backend edit fields into safe strings", () => {
    const hydrated = hydrateBranchForEdit({
      id: "branch-1",
      name: null,
      restaurantId: null,
      description: null,
      street: null,
      shopNumber: null,
      area: null,
      postalCode: null,
      city: null,
      state: null,
      country: null,
      logoUrl: null,
      coverImage: null,
      address: {
        street: null,
        shopNumber: null,
        area: null,
        postalCode: null,
        city: null,
        state: null,
        country: null,
        lat: null,
        lng: null,
      },
      branchAdmin: {
        email: null,
        firstName: null,
        lastName: null,
        phone: null,
        password: null,
      },
    } as unknown as BranchFormData);

    expect(hydrated.name).toBe("");
    expect(hydrated.restaurantId).toBe("");
    expect(hydrated.description).toBe("");
    expect(hydrated.street).toBe("");
    expect(hydrated.shopNumber).toBe("");
    expect(hydrated.area).toBe("");
    expect(hydrated.postalCode).toBe("");
    expect(hydrated.city).toBe("");
    expect(hydrated.state).toBe("");
    expect(hydrated.country).toBe("");
    expect(hydrated.logoUrl).toBe("");
    expect(hydrated.coverImage).toBe("");
    expect(hydrated.address).toMatchObject({
      street: "",
      shopNumber: "",
      area: "",
      postalCode: "",
      city: "",
      state: "",
      country: "",
      lat: undefined,
      lng: undefined,
    });
    expect(hydrated.branchAdmin).toEqual({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
  });

  it("includes edited branch admin info without sending a blank password", () => {
    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        branchAdmin: {
          email: "branch@yopmail.com",
          password: "",
          firstName: "Wajih ul",
          lastName: "Hassan",
          phone: "12345678",
        },
      },
      {}
    );

    expect(payload.branchAdmin).toEqual({
      email: "branch@yopmail.com",
      firstName: "Wajih ul",
      lastName: "Hassan",
      phone: "12345678",
    });
  });

  it("sends editable branch identity fields as flat backend patch fields", () => {
    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        street: "Main Road",
        shopNumber: "Shop 42",
        postalCode: "54000",
        city: "Lahore",
        area: "DHA",
        state: "Punjab",
        country: "Pakistan",
        lat: "31.5204",
        lng: "74.3587",
        logoUrl: "https://cdn.example.com/logo.png",
        coverImage: "https://cdn.example.com/cover.png",
        description: "Branch description",
        address: {
          street: "Old nested street",
          postalCode: "00000",
          lat: "0",
          lng: "0",
        },
      },
      {}
    );

    expect(payload).toMatchObject({
      street: "Main Road",
      shopNumber: "Shop 42",
      postalCode: "54000",
      city: "Lahore",
      area: "DHA",
      state: "Punjab",
      country: "Pakistan",
      lat: "31.5204",
      lng: "74.3587",
      logoUrl: "https://cdn.example.com/logo.png",
      coverImage: "https://cdn.example.com/cover.png",
      description: "Branch description",
    });
  });

  it("includes edited branch admin password only when provided", () => {
    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        branchAdmin: {
          email: " branch@yopmail.com ",
          password: " new-password ",
          firstName: " Wajih ul ",
          lastName: " Hassan ",
          phone: " 12345678 ",
        },
      },
      {}
    );

    expect(payload.branchAdmin).toEqual({
      email: "branch@yopmail.com",
      password: "new-password",
      firstName: "Wajih ul",
      lastName: "Hassan",
      phone: "12345678",
    });
  });

  it("omits branch admin object when every branch admin field is empty", () => {
    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        branchAdmin: {
          email: " ",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
        },
      },
      {}
    );

    expect(payload).not.toHaveProperty("branchAdmin");
  });

  it("preserves settings while adding branch admin to the patch payload", () => {
    const settings = {
      contact: {
        phone: "111",
        whatsapp: "222",
      },
      tableReservationsEnabled: true,
      tableCount: 4,
    };

    const payload = buildBranchPatchPayload(
      {
        restaurantId: "restaurant-1",
        name: "Blue Area",
        branchAdmin: {
          email: "branch@yopmail.com",
          firstName: "Wajih",
          lastName: "Hassan",
          phone: "12345678",
        },
      },
      settings
    );

    expect(payload.branchAdmin).toEqual({
      email: "branch@yopmail.com",
      firstName: "Wajih",
      lastName: "Hassan",
      phone: "12345678",
    });
    expect(payload.settings).toBe(settings);
  });

  it("hydrates branch admin info from branchAdmin profile fallback", () => {
    const hydrated = hydrateBranchForEdit({
      name: "Blue Area",
      branchAdmin: {
        email: "admin@example.com",
        profile: {
          firstName: "Ali",
          lastName: "Khan",
          phone: "+923001234567",
        },
      } as unknown as BranchFormData["branchAdmin"],
    });

    expect(hydrated.branchAdmin).toEqual({
      email: "admin@example.com",
      password: "",
      firstName: "Ali",
      lastName: "Khan",
      phone: "+923001234567",
    });
  });

  it("hydrates branch admin info from assignedManager or users fallback", () => {
    const assignedHydrated = hydrateBranchForEdit({
      name: "Blue Area",
      assignedManager: {
        email: "assigned@example.com",
        profile: {
          firstName: "Assigned",
          lastName: "Manager",
          phone: "111",
        },
      },
    });
    const usersHydrated = hydrateBranchForEdit({
      name: "Blue Area",
      users: [
        {
          email: "staff@example.com",
          role: "STAFF",
          profile: {
            firstName: "Staff",
          },
        },
        {
          email: "branch-admin@example.com",
          role: "BRANCH_ADMIN",
          profile: {
            firstName: "Branch",
            lastName: "Admin",
            phone: "222",
          },
        },
      ],
    });

    expect(assignedHydrated.branchAdmin?.email).toBe("assigned@example.com");
    expect(assignedHydrated.branchAdmin?.firstName).toBe("Assigned");
    expect(usersHydrated.branchAdmin).toEqual({
      email: "branch-admin@example.com",
      password: "",
      firstName: "Branch",
      lastName: "Admin",
      phone: "222",
    });
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
