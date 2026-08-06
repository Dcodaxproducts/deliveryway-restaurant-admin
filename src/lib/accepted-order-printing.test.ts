import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  printAcceptedOrderIfConfigured,
  printNewOrderIfConfigured,
} from "@/lib/accepted-order-printing";

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  getOrder: vi.fn(),
  print: vi.fn(),
  report: vi.fn(),
}));

vi.mock("@/services/printing/printing.api", () => ({
  getAdminPrintingSettings: mocks.getSettings,
  reportAdminPrinterEvent: mocks.report,
}));

vi.mock("@/services/orders/orders.api", () => ({
  getOrderById: mocks.getOrder,
}));

vi.mock("@/lib/local-printer", () => ({
  printLocalOrderTicket: mocks.print,
}));

const enabledSettings = {
  data: {
    settings: {
      enabled: true,
      autoPrintOnNewOrder: true,
      autoPrintOnStatusChange: true,
      printerName: "Kitchen USB",
      connectionType: "USB",
      paperSize: "80MM",
    },
  },
};

describe("accepted-order printing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSettings.mockResolvedValue(enabledSettings);
    mocks.getOrder.mockResolvedValue({ id: "order", items: [] });
    mocks.print.mockResolvedValue(undefined);
    mocks.report.mockResolvedValue(undefined);
  });

  it("prints the accepted order with branch settings", async () => {
    mocks.getOrder.mockResolvedValue({
      id: "print-order-1",
      orderNumber: "AC-1",
      items: [{ name: "Pizza", quantity: 1 }],
    });

    await expect(
      printAcceptedOrderIfConfigured({
        orderId: "print-order-1",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).resolves.toBe("printed");

    expect(mocks.print).toHaveBeenCalledWith(
      expect.objectContaining({
        printerName: "Kitchen USB",
        paperSize: "80MM",
      }),
    );
    expect(mocks.report).toHaveBeenCalledWith(
      expect.objectContaining({ event: "order_print", status: "success" }),
    );
  });

  it("prints a new order when new-order printing is enabled", async () => {
    mocks.getOrder.mockResolvedValue({
      id: "new-order-1",
      orderNumber: "AC-2",
      items: [{ name: "Burger", quantity: 1 }],
    });

    await expect(
      printNewOrderIfConfigured({
        orderId: "new-order-1",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).resolves.toBe("printed");

    expect(mocks.print).toHaveBeenCalledTimes(1);
    expect(mocks.report).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "order_print",
        status: "success",
        message: "New order AC-2 printed automatically.",
      }),
    );
  });

  it("uses the new-order toggle independently from accepted-order printing", async () => {
    mocks.getSettings.mockResolvedValue({
      data: {
        settings: {
          ...enabledSettings.data.settings,
          autoPrintOnNewOrder: false,
          autoPrintOnStatusChange: true,
        },
      },
    });

    await expect(
      printNewOrderIfConfigured({
        orderId: "new-order-disabled",
        restaurantId: "restaurant-1",
      }),
    ).resolves.toBe("skipped");
    expect(mocks.getOrder).not.toHaveBeenCalled();
    expect(mocks.print).not.toHaveBeenCalled();
  });

  it("deduplicates each order trigger without suppressing acceptance printing", async () => {
    const input = {
      orderId: "order-with-two-triggers",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    };

    await expect(printNewOrderIfConfigured(input)).resolves.toBe("printed");
    await expect(printNewOrderIfConfigured(input)).resolves.toBe("skipped");
    await expect(printAcceptedOrderIfConfigured(input)).resolves.toBe("printed");
    await expect(printAcceptedOrderIfConfigured(input)).resolves.toBe("skipped");
    expect(mocks.print).toHaveBeenCalledTimes(2);
  });

  it("suppresses a duplicate accepted-order print", async () => {
    mocks.getOrder.mockResolvedValue({ id: "duplicate-order", items: [] });
    const input = {
      orderId: "duplicate-order",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    };

    await expect(printAcceptedOrderIfConfigured(input)).resolves.toBe("printed");
    await expect(printAcceptedOrderIfConfigured(input)).resolves.toBe("skipped");
    expect(mocks.print).toHaveBeenCalledTimes(1);
  });

  it("skips printing when accepted-order printing is disabled", async () => {
    mocks.getSettings.mockResolvedValue({
      data: {
        settings: {
          ...enabledSettings.data.settings,
          autoPrintOnStatusChange: false,
        },
      },
    });

    await expect(
      printAcceptedOrderIfConfigured({
        orderId: "disabled-order",
        restaurantId: "restaurant-1",
      }),
    ).resolves.toBe("skipped");
    expect(mocks.getOrder).not.toHaveBeenCalled();
    expect(mocks.print).not.toHaveBeenCalled();
  });

  it("reports a print failure and allows a later retry", async () => {
    mocks.getOrder.mockResolvedValue({ id: "retry-order", items: [] });
    mocks.print.mockRejectedValueOnce(new Error("QZ unavailable"));
    const input = {
      orderId: "retry-order",
      restaurantId: "restaurant-1",
    };

    await expect(printAcceptedOrderIfConfigured(input)).rejects.toThrow(
      "QZ unavailable",
    );
    mocks.print.mockResolvedValue(undefined);
    await expect(printAcceptedOrderIfConfigured(input)).resolves.toBe("printed");
    expect(mocks.report).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", message: "QZ unavailable" }),
    );
    expect(mocks.print).toHaveBeenCalledTimes(2);
  });
});
