import type { PrintingConnectionType } from "@/services/printing";

export type PrinterValidationError =
  "connectionTypeRequired" | "printerRequired" | "queueRequired";

export const validatePrinterConnection = (settings: {
  connectionType: PrintingConnectionType | "";
  printerName: string;
  queueName: string;
}): PrinterValidationError | null => {
  if (!settings.connectionType) {
    return "connectionTypeRequired";
  }

  if (settings.connectionType !== "CLOUD" && !settings.printerName.trim()) {
    return "printerRequired";
  }

  if (settings.connectionType === "CLOUD" && !settings.queueName.trim()) {
    return "queueRequired";
  }

  return null;
};
