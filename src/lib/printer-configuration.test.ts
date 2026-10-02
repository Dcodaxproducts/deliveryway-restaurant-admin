import { describe, expect, it } from "vitest";

import {
  buildPrintingSettingsPayload,
  resolveLocalPrinterAvailability,
  type EditablePrinterSettings,
} from "@/lib/printer-configuration";
import type { AdminPrintingSettingsResponse } from "@/services/printing/printing.api";

const editable: EditablePrinterSettings = {
  enabled: true,
  autoPrintOnNewOrder: true,
  autoPrintOnStatusChange: false,
  printCustomerReceipt: false,
  printKitchenTicket: true,
  connectionType: "USB",
  paperSize: "80MM",
  printMode: "PIXEL_HTML",
  printerName: " Kitchen USB ",
  printerTarget: "",
  deviceId: "",
  ipAddress: "",
  queueName: "",
};

const response = (
  overrides: Partial<AdminPrintingSettingsResponse["data"]["settings"]> = {},
  scope: Partial<AdminPrintingSettingsResponse["data"]["scope"]> = {},
): AdminPrintingSettingsResponse => ({
  data: {
    scope: {
      tenantId: "tenant-1",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      ...scope,
    },
    settings: {
      enabled: true,
      autoPrintOnNewOrder: true,
      autoPrintOnStatusChange: false,
      printCustomerReceipt: false,
      printKitchenTicket: true,
      connectionType: "USB",
      paperSize: "80MM",
      printMode: "PIXEL_HTML",
      printerName: "Kitchen USB",
      printerTarget: null,
      deviceId: null,
      ipAddress: null,
      queueName: null,
      ...overrides,
    },
    source: "branch",
    inheritedFromRestaurant: false,
  },
  message: "ok",
});

describe("printer configuration", () => {
  it("normalizes the same persisted payload used by save and test print", () => {
    expect(
      buildPrintingSettingsPayload({
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        settings: editable,
      }),
    ).toEqual(
      expect.objectContaining({
        restaurantId: "restaurant-1",
        branchId: "branch-1",
        enabled: true,
        connectionType: "USB",
        printerName: "Kitchen USB",
        queueName: null,
      }),
    );
  });

  it("recognizes a configured and enabled local printer", () => {
    expect(
      resolveLocalPrinterAvailability({
        response: response(),
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).toMatchObject({ status: "ready" });
  });

  it("distinguishes a configured but disabled printer", () => {
    expect(
      resolveLocalPrinterAvailability({
        response: response({ enabled: false }),
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).toMatchObject({ status: "disabled" });
  });

  it("rejects stale configuration after a restaurant switch", () => {
    expect(
      resolveLocalPrinterAvailability({
        response: response(),
        restaurantId: "restaurant-2",
        branchId: "branch-2",
      }),
    ).toMatchObject({ status: "stale" });
  });

  it("rejects stale branch hydration and incomplete local settings", () => {
    expect(
      resolveLocalPrinterAvailability({
        response: response({}, { branchId: "branch-old" }),
        restaurantId: "restaurant-1",
        branchId: "branch-new",
      }),
    ).toMatchObject({ status: "stale" });
    expect(
      resolveLocalPrinterAvailability({
        response: response({ printerName: null }),
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).toMatchObject({ status: "not_configured" });
  });
});
