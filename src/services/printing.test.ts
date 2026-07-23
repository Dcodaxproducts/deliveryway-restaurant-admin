import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import {
  getAdminPrintingSettings,
  updateAdminPrintingSettings,
} from "@/services/printing";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("printing service", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it("scopes settings requests to the selected restaurant and branch", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { settings: {} } } });

    await getAdminPrintingSettings({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });

    expect(mockedApi.get).toHaveBeenCalledWith("/admin/printing/settings", {
      params: {
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      },
    });
  });

  it("sends the backend printing contract and supports clearing printer fields", async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { settings: {} } } });

    await updateAdminPrintingSettings({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      enabled: true,
      autoPrintOnNewOrder: true,
      autoPrintOnStatusChange: false,
      printCustomerReceipt: true,
      printKitchenTicket: true,
      connectionType: "LAN",
      printerName: null,
      printerTarget: "EPSON-TM-T20",
      deviceId: null,
      ipAddress: "192.168.1.50",
      queueName: null,
    });

    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/admin/printing/settings",
      {
        enabled: true,
        autoPrintOnNewOrder: true,
        autoPrintOnStatusChange: false,
        printCustomerReceipt: true,
        printKitchenTicket: true,
        connectionType: "LAN",
        printerName: null,
        printerTarget: "EPSON-TM-T20",
        deviceId: null,
        ipAddress: "192.168.1.50",
        queueName: null,
      },
      {
        params: {
          restaurantId: "restaurant-1",
          branchId: "branch-1",
        },
      },
    );
  });
});
