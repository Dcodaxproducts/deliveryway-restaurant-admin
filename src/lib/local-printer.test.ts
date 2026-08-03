import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  discoverLocalPrinters,
  printLocalTestTicket,
} from "@/lib/local-printer";

const qzMocks = vi.hoisted(() => ({
  isActive: vi.fn(),
  connect: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  print: vi.fn(),
}));

vi.mock("qz-tray", () => ({
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

    await printLocalTestTicket("Kitchen USB");

    expect(qzMocks.connect).toHaveBeenCalledTimes(1);
    expect(qzMocks.create).toHaveBeenCalledWith("Kitchen USB", {
      jobName: "DeliveryWays printer test",
    });
    expect(qzMocks.print).toHaveBeenCalledTimes(1);
  });
});
