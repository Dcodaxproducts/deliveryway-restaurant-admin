import type { PrintingConnectionType } from "@/services/printing";

export type PrinterValidationError =
  | "connectionTypeRequired"
  | "printerRequired"
  | "queueRequired"
  | "cloudAutoPrintUnsupported"
  | "printRuleRequired"
  | "printCopyRequired";

export const validatePrinterConnection = (settings: {
  connectionType: PrintingConnectionType | "";
  printerName: string;
  queueName: string;
  enabled?: boolean;
  autoPrintOnNewOrder?: boolean;
  autoPrintOnStatusChange?: boolean;
  printCustomerReceipt?: boolean;
  printKitchenTicket?: boolean;
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

  if (settings.enabled && settings.connectionType === "CLOUD") {
    return "cloudAutoPrintUnsupported";
  }

  if (
    settings.enabled &&
    !settings.autoPrintOnNewOrder &&
    !settings.autoPrintOnStatusChange
  ) {
    return "printRuleRequired";
  }

  if (
    settings.enabled &&
    !settings.printCustomerReceipt &&
    !settings.printKitchenTicket
  ) {
    return "printCopyRequired";
  }

  return null;
};
