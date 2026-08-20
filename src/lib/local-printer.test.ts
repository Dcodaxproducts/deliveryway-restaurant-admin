import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  discoverLocalPrinters,
  printLocalOrderTicket,
  printLocalTestTicket,
} from "@/lib/local-printer";

const qzMocks = vi.hoisted(() => ({
  setCertificatePromise: vi.fn(),
  setSignatureAlgorithm: vi.fn(),
  setSignaturePromise: vi.fn(),
  isActive: vi.fn(),
  connect: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  print: vi.fn(),
}));

const qzSigningMocks = vi.hoisted(() => ({
  getCertificate: vi.fn(),
  signChallenge: vi.fn(),
}));

vi.mock("@/services/printing", () => ({
  getQzCertificate: qzSigningMocks.getCertificate,
  signQzChallenge: qzSigningMocks.signChallenge,
}));

vi.mock("qz-tray", () => ({
  security: {
    setCertificatePromise: qzMocks.setCertificatePromise,
    setSignatureAlgorithm: qzMocks.setSignatureAlgorithm,
    setSignaturePromise: qzMocks.setSignaturePromise,
  },
  websocket: {
    isActive: qzMocks.isActive,
    connect: qzMocks.connect,
  },
  printers: { find: qzMocks.find },
  configs: { create: qzMocks.create },
  print: qzMocks.print,
}));

describe("local printer bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    qzMocks.isActive.mockReturnValue(true);
    qzSigningMocks.getCertificate.mockResolvedValue("certificate");
    qzSigningMocks.signChallenge.mockResolvedValue("signature");
  });

  it("configures QZ Premium certificate and SHA512 signing before connecting", async () => {
    qzMocks.isActive.mockReturnValue(false);
    qzMocks.connect.mockResolvedValue(undefined);
    qzMocks.find.mockResolvedValue(["Kitchen USB"]);

    await discoverLocalPrinters();

    expect(qzMocks.setCertificatePromise).toHaveBeenCalledWith(
      qzSigningMocks.getCertificate,
    );
    expect(qzMocks.setSignatureAlgorithm).toHaveBeenCalledWith("SHA512");
    expect(qzMocks.setSignaturePromise).toHaveBeenCalledWith(
      qzSigningMocks.signChallenge,
    );
    expect(
      qzMocks.setSignaturePromise.mock.invocationCallOrder[0],
    ).toBeLessThan(qzMocks.connect.mock.invocationCallOrder[0]);
  });

  it("returns unique installed printer queues", async () => {
    qzMocks.find.mockResolvedValue(["Kitchen USB", "Kitchen USB", "Receipt"]);

    await expect(discoverLocalPrinters()).resolves.toEqual([
      "Kitchen USB",
      "Receipt",
    ]);
  });

  it("connects and sends a test ticket to the selected printer", async () => {
    qzMocks.isActive.mockReturnValue(false);
    qzMocks.connect.mockResolvedValue(undefined);
    qzMocks.create.mockReturnValue({ printer: "Kitchen USB" });
    qzMocks.print.mockResolvedValue(undefined);

    await printLocalTestTicket("Kitchen USB", "58MM");

    expect(qzMocks.connect).toHaveBeenCalledTimes(1);
    expect(qzMocks.create).toHaveBeenCalledWith("Kitchen USB", {
      jobName: "DeliveryWays printer test",
      units: "mm",
      size: { width: 58 },
      margins: 4,
      scaleContent: false,
    });
    expect(qzMocks.print).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["A4", { width: 210, height: 297 }, 10],
    ["A5", { width: 148, height: 210 }, 8],
    ["80MM", { width: 80 }, 4],
    ["58MM", { width: 58 }, 4],
  ] as const)("prints an order using %s paper", async (paperSize, size, margins) => {
    qzMocks.create.mockReturnValue({ printer: "Kitchen USB" });
    qzMocks.print.mockResolvedValue(undefined);

    await printLocalOrderTicket({
      printerName: "Kitchen USB",
      paperSize,
      ticket: { id: "order-1", orderNumber: "42", items: [] },
    });

    expect(qzMocks.create).toHaveBeenCalledWith(
      "Kitchen USB",
      expect.objectContaining({
        jobName: "DeliveryWays order 42",
        units: "mm",
        size,
        margins,
      }),
    );
  });

  it("prints a native ESC/POS order using CP858 encoding", async () => {
    qzMocks.create.mockReturnValue({ printer: "Generic / Text Only" });
    qzMocks.print.mockResolvedValue(undefined);

    await printLocalOrderTicket({
      printerName: "Generic / Text Only",
      paperSize: "58MM",
      printMode: "ESC_POS",
      ticket: {
        id: "order-1",
        orderNumber: "42",
        customerName: "Jörg Weiß",
        totalAmount: 12.5,
        currency: "EUR",
        items: [{ name: "Döner", quantity: 1, modifiers: [] }],
      },
    });

    expect(qzMocks.create).toHaveBeenCalledWith("Generic / Text Only", {
      jobName: "DeliveryWays order 42",
      encoding: "CP858",
    });
    expect(qzMocks.print).toHaveBeenCalledWith(
      { printer: "Generic / Text Only" },
      [
        expect.objectContaining({
          type: "raw",
          format: "command",
          flavor: "plain",
          data: expect.stringContaining("Jörg Weiß"),
        }),
      ],
    );
  });

  it("rejects ESC/POS mode for sheet paper", async () => {
    qzMocks.create.mockReturnValue({ printer: "Kitchen USB" });

    await expect(
      printLocalTestTicket("Kitchen USB", "A4", "ESC_POS"),
    ).rejects.toThrow("ESC/POS printing requires 58 mm or 80 mm paper");
  });
});
