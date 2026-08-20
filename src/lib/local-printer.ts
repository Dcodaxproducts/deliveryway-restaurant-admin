import {
  buildOrderTicketEscPos,
  buildOrderTicketHtml,
  type OrderTicket,
} from "@/lib/order-ticket";
import {
  getQzCertificate,
  signQzChallenge,
  type PrintingMode,
  type PrintingPaperSize,
} from "@/services/printing";

const QZ_UNAVAILABLE_MESSAGE =
  "QZ Tray is not running. Install or start QZ Tray on this computer, then try again.";

const configureQzSecurity = (qz: typeof import("qz-tray")) => {
  qz.security.setCertificatePromise(getQzCertificate);
  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise(signQzChallenge);
};

const connectToQzTray = async () => {
  const qz = await import("qz-tray");
  configureQzSecurity(qz);

  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect({ retries: 1, delay: 0 });
    } catch {
      throw new Error(QZ_UNAVAILABLE_MESSAGE);
    }
  }

  return qz;
};

const paperOptions: Record<PrintingPaperSize, { width: number; height?: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  "80MM": { width: 80 },
  "58MM": { width: 58 },
};

const paperMargins: Record<PrintingPaperSize, number> = {
  A4: 10,
  A5: 8,
  "80MM": 4,
  "58MM": 4,
};

const createPrintOptions = (
  paperSize: PrintingPaperSize,
  jobName: string,
  printMode: PrintingMode,
) => ({
  jobName,
  ...(printMode === "ESC_POS"
    ? { encoding: "CP858" }
    : {
        units: "mm" as const,
        size: paperOptions[paperSize],
        margins: paperMargins[paperSize],
        scaleContent: false,
      }),
});

function assertEscPosPaper(
  paperSize: PrintingPaperSize,
): asserts paperSize is Extract<PrintingPaperSize, "58MM" | "80MM"> {
  if (paperSize !== "58MM" && paperSize !== "80MM") {
    throw new Error("ESC/POS printing requires 58 mm or 80 mm paper.");
  }
}

export const discoverLocalPrinters = async (): Promise<string[]> => {
  const qz = await connectToQzTray();
  const result = await qz.printers.find();
  const printers = Array.isArray(result) ? result : [result];

  return [
    ...new Set(printers.map((printer) => printer.trim()).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right));
};

export const printLocalTestTicket = async (
  printerName: string,
  paperSize: PrintingPaperSize = "80MM",
  printMode: PrintingMode = "PIXEL_HTML",
) => {
  const selectedPrinter = printerName.trim();
  if (!selectedPrinter) {
    throw new Error("Select a printer before sending a test print.");
  }

  const qz = await connectToQzTray();
  const config = qz.configs.create(
    selectedPrinter,
    createPrintOptions(paperSize, "DeliveryWays printer test", printMode),
  );

  if (printMode === "ESC_POS") {
    assertEscPosPaper(paperSize);
    await qz.print(config, [
      {
        type: "raw",
        format: "command",
        flavor: "plain",
        data: [
          "\x1b@",
          "\x1bt\x13",
          "\x1ba\x01",
          "\x1d!\x11",
          "DeliveryWays\n",
          "\x1d!\x00",
          "ESC/POS printer test successful.\n",
          `${new Date().toLocaleString()}\n\n\n\n`,
        ].join(""),
      },
    ]);
    return;
  }

  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: [
        "<div style='font-family: sans-serif; padding: 16px'>",
        "<h2>DeliveryWays</h2>",
        "<p>Printer connection test successful.</p>",
        `<p>${new Date().toLocaleString()}</p>`,
        "</div>",
      ].join(""),
    },
  ]);
};

export const printLocalOrderTicket = async ({
  printerName,
  paperSize,
  printMode = "PIXEL_HTML",
  ticket,
}: {
  printerName: string;
  paperSize: PrintingPaperSize;
  printMode?: PrintingMode;
  ticket: OrderTicket;
}) => {
  const selectedPrinter = printerName.trim();
  if (!selectedPrinter) {
    throw new Error("Select a printer before printing an order.");
  }

  const qz = await connectToQzTray();
  const config = qz.configs.create(
    selectedPrinter,
    createPrintOptions(
      paperSize,
      `DeliveryWays order ${ticket.orderNumber ?? ticket.id}`,
      printMode,
    ),
  );

  if (printMode === "ESC_POS") {
    assertEscPosPaper(paperSize);
    await qz.print(config, [
      {
        type: "raw",
        format: "command",
        flavor: "plain",
        data: buildOrderTicketEscPos(ticket, paperSize),
      },
    ]);
    return;
  }

  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: buildOrderTicketHtml(ticket, paperSize),
    },
  ]);
};
