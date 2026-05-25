import api from "@/lib/axios";

export type PrintingQueryParams = {
  restaurantId: string;
  branchId?: string | null;
};

export type UpdatePrintingSettingsPayload = {
  restaurantId: string;
  branchId?: string | null;

  autoPrintEnabled?: boolean;
  printKitchenTickets?: boolean;
  printCustomerReceipts?: boolean;
  printerName?: string;
  printerIp?: string;
  printerPort?: number;
  copies?: number;
};

const buildPrintingParams = (params?: PrintingQueryParams) => {
  return {
    restaurantId: params?.restaurantId,
    ...(params?.branchId ? { branchId: params.branchId } : {}),
  };
};

export const getAdminPrintingSettings = async (
  params?: PrintingQueryParams
) => {
  const response = await api.get("/admin/printing/settings", {
    params: buildPrintingParams(params),
  });

  return response.data;
};

export const updateAdminPrintingSettings = async (
  payload: UpdatePrintingSettingsPayload
) => {
  const { restaurantId, branchId, ...body } = payload;

  const response = await api.patch(
    "/admin/printing/settings",
    body,
    {
      params: buildPrintingParams({
        restaurantId,
        branchId,
      }),
    }
  );

  return response.data;
};

export const getAdminPrintingStatus = async (
  params?: PrintingQueryParams
) => {
  const response = await api.get("/admin/printing/status", {
    params: buildPrintingParams(params),
  });

  return response.data;
};

export const getAdminPrintingLogs = async (
  params?: PrintingQueryParams
) => {
  const response = await api.get("/admin/printing/logs", {
    params: buildPrintingParams(params),
  });

  return response.data;
};