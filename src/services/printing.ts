import { api } from "@/lib/axios";

export type PrintingQueryParams = {
  restaurantId: string;
  branchId?: string | null;
};

export type PrintingConnectionType = "USB" | "LAN" | "BLUETOOTH" | "CLOUD";
export type PrintingPaperSize = "A4" | "A5" | "80MM" | "58MM";
export type PrintingMode = "PIXEL_HTML" | "ESC_POS";

export type AdminPrintingSettings = {
  enabled: boolean;
  autoPrintOnNewOrder: boolean;
  autoPrintOnStatusChange: boolean;
  printCustomerReceipt: boolean;
  printKitchenTicket: boolean;
  connectionType: PrintingConnectionType | null;
  paperSize: PrintingPaperSize;
  printMode: PrintingMode;
  printerName: string | null;
  printerTarget: string | null;
  deviceId: string | null;
  ipAddress: string | null;
  queueName: string | null;
};

export type PrinterLogItem = {
  id: string;
  type: "printer";
  status: "success" | "failed" | "warning";
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

type AdminPrintingScope = {
  tenantId: string | null;
  restaurantId: string | null;
  branchId: string | null;
};

export type AdminPrintingSettingsResponse = {
  data: {
    scope: AdminPrintingScope;
    settings: AdminPrintingSettings;
    source: "restaurant" | "branch";
    inheritedFromRestaurant: boolean;
  };
  message: string;
};

export type AdminPrintingStatusResponse = {
  data: AdminPrintingSettingsResponse["data"] & {
    health: {
      status: PrinterLogItem["status"] | "tracking_pending";
      totalEvents: number;
      successCount: number;
      failedCount: number;
      warningCount: number;
      latest: PrinterLogItem | null;
      latestSuccess: PrinterLogItem | null;
      latestFailure: PrinterLogItem | null;
      latestWarning: PrinterLogItem | null;
      latestErrorMessage: string | null;
    };
  };
  message: string;
};

export type UpdatePrintingSettingsPayload = {
  restaurantId: string;
  branchId?: string | null;
} & Partial<
  Omit<
    AdminPrintingSettings,
    "printerName" | "printerTarget" | "deviceId" | "ipAddress" | "queueName"
  >
> & {
    printerName?: string | null;
    printerTarget?: string | null;
    deviceId?: string | null;
    ipAddress?: string | null;
    queueName?: string | null;
  };

export type ReportPrinterEventPayload = PrintingQueryParams & {
  status: "success" | "failed" | "warning";
  event: "discovery" | "connection" | "test_print" | "order_print";
  message: string;
  printerName?: string;
};

const buildPrintingParams = (params?: PrintingQueryParams) => {
  return {
    restaurantId: params?.restaurantId,
    ...(params?.branchId ? { branchId: params.branchId } : {}),
  };
};

export const getAdminPrintingSettings = async (
  params?: PrintingQueryParams,
): Promise<AdminPrintingSettingsResponse> => {
  const response = await api.get("/admin/printing/settings", {
    params: buildPrintingParams(params),
  });

  return response.data;
};

export const updateAdminPrintingSettings = async (
  payload: UpdatePrintingSettingsPayload,
): Promise<AdminPrintingSettingsResponse> => {
  const { restaurantId, branchId, ...body } = payload;

  const response = await api.patch("/admin/printing/settings", body, {
    params: buildPrintingParams({
      restaurantId,
      branchId,
    }),
  });

  return response.data;
};

export const getAdminPrintingStatus = async (
  params?: PrintingQueryParams,
): Promise<AdminPrintingStatusResponse> => {
  const response = await api.get("/admin/printing/status", {
    params: buildPrintingParams(params),
  });

  return response.data;
};

export const getAdminPrintingLogs = async (params?: PrintingQueryParams) => {
  const response = await api.get("/admin/printing/logs", {
    params: buildPrintingParams(params),
  });

  return response.data;
};

export const reportAdminPrinterEvent = async (
  payload: ReportPrinterEventPayload,
) => {
  const { restaurantId, branchId, ...body } = payload;
  const response = await api.post("/admin/printing/events", body, {
    params: buildPrintingParams({ restaurantId, branchId }),
  });

  return response.data;
};
