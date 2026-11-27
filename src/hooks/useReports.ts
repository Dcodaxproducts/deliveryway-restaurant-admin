import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  exportCustomersReport,
  exportMenuReport,
  exportOrdersReport,
  FinancialReportParams,
  getAdminReportInvoiceDetails,
  getAdminReportInvoices,
  getFinancialReport,
  getGeneratedInvoices,
  getOrdersReport,
  OrdersReportParams,
  AdminInvoicesParams,
  AdminInvoiceDetailsParams,
  GeneratedInvoicesParams,
  MenuExportReportParams,
  OrdersExportReportParams,
  CustomersExportReportParams,
  CsvExportResponse,
} from "@/services/reports/reports.api";

/**
 * ==============================
 * HELPERS
 * ==============================
 */

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

const getCsvExportBlob = (response: CsvExportResponse) => {
  const content = response?.data?.content || "";
  const mimeType = response?.data?.mimeType || "text/csv;charset=utf-8";

  /**
   * BOM helps Excel read CSV encoding correctly.
   */
  return new Blob([`\uFEFF${content}`], {
    type: mimeType.includes("charset") ? mimeType : `${mimeType};charset=utf-8`,
  });
};

const downloadCsvExportResponse = (
  response: CsvExportResponse,
  fallbackFileName: string
) => {
  const fileName = response?.data?.fileName || fallbackFileName;
  const blob = getCsvExportBlob(response);

  downloadBlobFile(blob, fileName);
};

const getErrorMessage = (_error: unknown, fallback: string) => fallback;

/**
 * ==============================
 * REPORT SUMMARY HOOKS
 * ==============================
 */

export const useGetOrdersReport = (
  params?: OrdersReportParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [
      "reports",
      "orders",
      params?.restaurantId,
      params?.branchId,
      params?.fromDate,
      params?.toDate,
      params?.status,
      params?.orderType,
      params?.paymentStatus,
      params?.kind,
      params?.excludeStatus,
      params?.orderTimeFrom,
      params?.orderTimeTo,
      params?.isScheduled,
    ],
    queryFn: () => getOrdersReport(params),
    enabled: options?.enabled ?? Boolean(params),
  });
};

export const useGetFinancialReport = (params?: FinancialReportParams) => {
  return useQuery({
    queryKey: [
      "reports",
      "financial",
      params?.restaurantId,
      params?.branchId,
      params?.fromDate,
      params?.toDate,
    ],
    queryFn: () => getFinancialReport(params),
  });
};

/**
 * ==============================
 * INVOICE REPORT HOOKS
 * ==============================
 */

export const useGetGeneratedInvoices = (
  params?: GeneratedInvoicesParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [
      "reports",
      "generated-invoices",
      params?.restaurantId,
      params?.branchId,
      params?.kind,
      params?.status,
      params?.subscriptionId,
      params?.orderId,
      params?.fromDate,
      params?.toDate,
    ],
    queryFn: () => getGeneratedInvoices(params),
    enabled: options?.enabled ?? true,
  });
};

export const useGetAdminReportInvoices = (params?: AdminInvoicesParams) => {
  return useQuery({
    queryKey: [
      "reports",
      "invoices",
      params?.restaurantId,
      params?.branchId,
      params?.fromDate,
      params?.toDate,
      params?.status,
      params?.orderType,
      params?.paymentStatus,
      params?.kind,
    ],
    queryFn: () => getAdminReportInvoices(params),
  });
};

export const useGetAdminReportInvoiceDetails = (
  params?: AdminInvoiceDetailsParams
) => {
  return useQuery({
    queryKey: [
      "reports",
      "invoice-details",
      params?.orderId,
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () =>
      getAdminReportInvoiceDetails(params as AdminInvoiceDetailsParams),
    enabled: Boolean(params?.orderId),
  });
};

/**
 * ==============================
 * EXPORT HOOKS
 * ==============================
 */

export const useExportMenuReport = () => {
  const t = useTranslations("reports");
  return useMutation({
    mutationFn: (params?: MenuExportReportParams) => exportMenuReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "menu-report.csv");

      toast.success(
        t("menuExportSuccess", { count: response?.data?.rowCount ?? -1 })
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, getLocalizedMessage("notification061")));
    },
  });
};

export const useExportOrdersReport = () => {
  const t = useTranslations("reports");
  return useMutation({
    mutationFn: (params?: OrdersExportReportParams) =>
      exportOrdersReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "orders-report.csv");

      toast.success(
        t("ordersExportSuccess", { count: response?.data?.rowCount ?? -1 })
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, getLocalizedMessage("notification062")));
    },
  });
};

export const useExportCustomersReport = () => {
  const t = useTranslations("reports");
  return useMutation({
    mutationFn: (params?: CustomersExportReportParams) =>
      exportCustomersReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "customers-report.csv");

      toast.success(
        t("customersExportSuccess", { count: response?.data?.rowCount ?? -1 })
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, getLocalizedMessage("notification060")));
    },
  });
};
