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
});
