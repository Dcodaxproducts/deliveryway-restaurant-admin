import type {
  AdminPrintingSettings,
  AdminPrintingSettingsResponse,
  PrintingConnectionType,
  PrintingMode,
  PrintingPaperSize,
  UpdatePrintingSettingsPayload,
} from "@/services/printing/printing.api";

export type EditablePrinterSettings = {
  enabled: boolean;
  autoPrintOnNewOrder: boolean;
  autoPrintOnStatusChange: boolean;
  printCustomerReceipt: boolean;
  printKitchenTicket: boolean;
  connectionType: PrintingConnectionType | "";
  paperSize: PrintingPaperSize;
  printMode: PrintingMode;
  printerName: string;
  printerTarget: string;
  deviceId: string;
  ipAddress: string;
  queueName: string;
};

export type LocalPrinterAvailability =
  | { status: "ready"; settings: AdminPrintingSettings }
  | {
      status: "disabled" | "not_configured" | "unsupported" | "stale";
      settings?: AdminPrintingSettings;
    };

export const buildPrintingSettingsPayload = ({
  restaurantId,
  branchId,
  settings,
}: {
  restaurantId: string;
  branchId?: string;
  settings: EditablePrinterSettings;
}): UpdatePrintingSettingsPayload => ({
  restaurantId,
  branchId,
  enabled: settings.enabled,
  autoPrintOnNewOrder: settings.autoPrintOnNewOrder,
  autoPrintOnStatusChange: settings.autoPrintOnStatusChange,
  printCustomerReceipt: settings.printCustomerReceipt,
  printKitchenTicket: settings.printKitchenTicket,
  connectionType: settings.connectionType || null,
  paperSize: settings.paperSize,
  printMode: settings.printMode,
  printerName: settings.printerName.trim() || null,
  printerTarget: settings.printerTarget.trim() || null,
  deviceId: settings.deviceId.trim() || null,
  ipAddress: settings.ipAddress.trim() || null,
  queueName: settings.queueName.trim() || null,
});

export const resolveLocalPrinterAvailability = ({
  response,
  restaurantId,
  branchId,
}: {
  response: AdminPrintingSettingsResponse;
  restaurantId: string;
  branchId?: string;
}): LocalPrinterAvailability => {
  const { settings } = response.data;
  const scope = response.data.scope;
  const wrongRestaurant =
    Boolean(scope?.restaurantId) && scope.restaurantId !== restaurantId;
  const wrongBranch =
    Boolean(branchId) && Boolean(scope?.branchId) && scope.branchId !== branchId;

  if (wrongRestaurant || wrongBranch) return { status: "stale", settings };
  if (!settings.enabled) return { status: "disabled", settings };
  if (settings.connectionType === "CLOUD") {
    return { status: "unsupported", settings };
  }
  if (!settings.connectionType || !settings.printerName?.trim()) {
    return { status: "not_configured", settings };
  }

  return { status: "ready", settings };
};
