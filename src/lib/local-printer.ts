const QZ_UNAVAILABLE_MESSAGE =
  "QZ Tray is not running. Install or start QZ Tray on this computer, then try again.";

const connectToQzTray = async () => {
  const qz = await import("qz-tray");

  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect({ retries: 1, delay: 0 });
    } catch {
      throw new Error(QZ_UNAVAILABLE_MESSAGE);
    }
  }

  return qz;
};

export const discoverLocalPrinters = async (): Promise<string[]> => {
  const qz = await connectToQzTray();
  const result = await qz.printers.find();
  const printers = Array.isArray(result) ? result : [result];

  return [
    ...new Set(printers.map((printer) => printer.trim()).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right));
};

export const printLocalTestTicket = async (printerName: string) => {
  const selectedPrinter = printerName.trim();
  if (!selectedPrinter) {
    throw new Error("Select a printer before sending a test print.");
  }

  const qz = await connectToQzTray();
  const config = qz.configs.create(selectedPrinter, {
    jobName: "DeliveryWays printer test",
  });

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
