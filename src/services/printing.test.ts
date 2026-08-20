import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/axios";
import {
  getQzCertificate,
  getAdminPrintingSettings,
  reportAdminPrinterEvent,
  signQzChallenge,
  updateAdminPrintingSettings,
} from "@/services/printing";

vi.mock("@/lib/axios", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("printing service", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
    mockedApi.post.mockReset();
  });

  it("fetches the QZ certificate from the authenticated printing endpoint", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { data: { certificate: "certificate" }, message: "ok" },
    });

    await expect(getQzCertificate()).resolves.toBe("certificate");
    expect(mockedApi.get).toHaveBeenCalledWith(
      "/admin/printing/qz/certificate",
    );
  });

  it("sends an exact QZ challenge and returns its signature", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { data: { signature: "signature" }, message: "ok" },
    });

    await expect(signQzChallenge("challenge")).resolves.toBe("signature");
    expect(mockedApi.post).toHaveBeenCalledWith(
      "/admin/printing/qz/signature",
      { challenge: "challenge" },
    );
  });

  it("reports scoped local printer events", async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { data: { recorded: true } },
    });

    await reportAdminPrinterEvent({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      event: "test_print",
      status: "success",
      message: "Test print completed",
      printerName: "Kitchen USB",
    });

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/admin/printing/events",
      {
        event: "test_print",
        status: "success",
        message: "Test print completed",
        printerName: "Kitchen USB",
      },
      {
        params: {
          restaurantId: "restaurant-1",
          branchId: "branch-1",
        },
      },
    );
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
