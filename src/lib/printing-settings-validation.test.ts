import { describe, expect, it } from "vitest";

import { validatePrinterConnection } from "@/lib/printing-settings-validation";

describe("printer settings validation", () => {
  it("rejects empty connection settings", () => {
    expect(
      validatePrinterConnection({
        connectionType: "",
        printerName: "",
        queueName: "",
      }),
    ).toBe("connectionTypeRequired");
  });

  it("requires an installed printer for local connections", () => {
    expect(
      validatePrinterConnection({
        connectionType: "USB",
        printerName: "",
        queueName: "",
      }),
    ).toBe("printerRequired");
  });

  it("requires a queue name for cloud printing", () => {
    expect(
      validatePrinterConnection({
        connectionType: "CLOUD",
        printerName: "",
        queueName: "",
      }),
    ).toBe("queueRequired");
  });

  it("accepts a discovered local printer", () => {
    expect(
      validatePrinterConnection({
        connectionType: "USB",
        printerName: "Kitchen USB",
        queueName: "",
      }),
    ).toBeNull();
  });

  it("requires a complete automatic-print configuration when enabled", () => {
    expect(
      validatePrinterConnection({
        connectionType: "USB",
        printerName: "Kitchen USB",
        queueName: "",
        enabled: true,
        autoPrintOnNewOrder: false,
        autoPrintOnStatusChange: false,
        printKitchenTicket: true,
      }),
    ).toBe("printRuleRequired");

    expect(
      validatePrinterConnection({
        connectionType: "USB",
        printerName: "Kitchen USB",
        queueName: "",
        enabled: true,
        autoPrintOnNewOrder: true,
        printKitchenTicket: false,
        printCustomerReceipt: false,
      }),
    ).toBe("printCopyRequired");
  });

  it("does not claim cloud queues support browser auto-printing", () => {
    expect(
      validatePrinterConnection({
        connectionType: "CLOUD",
        printerName: "",
        queueName: "future-queue",
        enabled: true,
        autoPrintOnNewOrder: true,
        printKitchenTicket: true,
      }),
    ).toBe("cloudAutoPrintUnsupported");
  });
});
