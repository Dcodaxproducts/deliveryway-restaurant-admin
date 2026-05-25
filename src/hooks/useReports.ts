import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  exportCustomersReport,
  exportMenuReport,
  exportOrdersReport,
  FinancialReportParams,
  getAdminReportInvoiceDetails,
  getAdminReportInvoices,
  getFinancialReport,
  getOrdersReport,
  OrdersReportParams,
  AdminInvoicesParams,
  AdminInvoiceDetailsParams,
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

const getExportRowCountText = (response: CsvExportResponse) => {
  const rowCount = response?.data?.rowCount;

  if (typeof rowCount !== "number") return "";

  return ` (${rowCount} rows)`;
};

const getErrorMessage = (err: any, fallback: string) => {
  return err?.response?.data?.message || err?.message || fallback;
};

/**
 * ==============================
 * REPORT SUMMARY HOOKS
 * ==============================
 */

export const useGetOrdersReport = (params?: OrdersReportParams) => {
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
    ],
    queryFn: () => getOrdersReport(params),
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
  return useMutation({
    mutationFn: (params?: MenuExportReportParams) => exportMenuReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "menu-report.csv");

      toast.success(
        `Menu report exported successfully${getExportRowCountText(response)}`
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to export menu report"));
    },
  });
};

export const useExportOrdersReport = () => {
  return useMutation({
    mutationFn: (params?: OrdersExportReportParams) =>
      exportOrdersReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "orders-report.csv");

      toast.success(
        `Orders report exported successfully${getExportRowCountText(response)}`
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to export orders report"));
    },
  });
};

export const useExportCustomersReport = () => {
  return useMutation({
    mutationFn: (params?: CustomersExportReportParams) =>
      exportCustomersReport(params),

    onSuccess: (response) => {
      downloadCsvExportResponse(response, "customers-report.csv");

      toast.success(
        `Customers report exported successfully${getExportRowCountText(
          response
        )}`
      );
    },

    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to export customers report"));
    },
  });
};