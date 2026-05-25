import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminPrintingLogs,
  getAdminPrintingSettings,
  getAdminPrintingStatus,
  updateAdminPrintingSettings,
  PrintingQueryParams,
  UpdatePrintingSettingsPayload,
} from "@/services/printing/printing.api";

export const printingQueryKeys = {
  all: ["admin-printing"] as const,

  settings: (params?: PrintingQueryParams) =>
    [
      "admin-printing",
      "settings",
      params?.restaurantId,
      params?.branchId,
    ] as const,

  status: (params?: PrintingQueryParams) =>
    [
      "admin-printing",
      "status",
      params?.restaurantId,
      params?.branchId,
    ] as const,

  logs: (params?: PrintingQueryParams) =>
    [
      "admin-printing",
      "logs",
      params?.restaurantId,
      params?.branchId,
    ] as const,
};

export const useGetAdminPrintingSettings = (
  params?: PrintingQueryParams
) => {
  return useQuery({
    queryKey: printingQueryKeys.settings(params),
    queryFn: () => getAdminPrintingSettings(params),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useUpdateAdminPrintingSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePrintingSettingsPayload) =>
      updateAdminPrintingSettings(payload),

    onSuccess: (_, variables) => {
      const params = {
        restaurantId: variables.restaurantId,
        branchId: variables.branchId,
      };

      queryClient.invalidateQueries({
        queryKey: printingQueryKeys.settings(params),
      });

      queryClient.invalidateQueries({
        queryKey: printingQueryKeys.status(params),
      });

      queryClient.invalidateQueries({
        queryKey: printingQueryKeys.logs(params),
      });
    },
  });
};

export const useGetAdminPrintingStatus = (
  params?: PrintingQueryParams
) => {
  return useQuery({
    queryKey: printingQueryKeys.status(params),
    queryFn: () => getAdminPrintingStatus(params),
    enabled: Boolean(params?.restaurantId),
    refetchInterval: 30000,
  });
};

export const useGetAdminPrintingLogs = (
  params?: PrintingQueryParams
) => {
  return useQuery({
    queryKey: printingQueryKeys.logs(params),
    queryFn: () => getAdminPrintingLogs(params),
    enabled: Boolean(params?.restaurantId),
  });
};