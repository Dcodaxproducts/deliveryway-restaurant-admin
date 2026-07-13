"use client";

import { Download, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  useDownloadOrderInvoicePdf,
  useSendOrderInvoiceEmail,
} from "@/hooks/useOrders";
import type { GeneratedInvoice } from "@/services/reports/reports.api";

const formatMoney = (amount?: number | null, currency?: string | null) => {
  const numericAmount = Number(amount ?? 0);
  const currencyCode = currency || "PKR";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString()} ${currencyCode}`;
  }
};

const prettyLabel = (value?: string | null) =>
  value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "-";

const getStatusClassName = (status?: string | null) => {
  const normalized = status?.toUpperCase();

  if (
    normalized === "SENT" ||
    normalized === "ISSUED" ||
    normalized === "PAID"
  ) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "FAILED" ||
    normalized === "VOID" ||
    normalized === "CANCELLED"
  ) {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
};

interface GeneratedInvoiceHistoryTableProps {
  invoices: GeneratedInvoice[];
  loading: boolean;
}

export function GeneratedInvoiceHistoryTable({
  invoices,
  loading,
}: GeneratedInvoiceHistoryTableProps) {
  const t = useTranslations("orders");
  const queryClient = useQueryClient();
  const { user, branchId, isBranchAdmin } = useAuth();
  const downloadInvoiceMutation = useDownloadOrderInvoicePdf({
    success: t("invoiceDownloaded"),
    error: t("invoiceDownloadFailed"),
  });
  const sendInvoiceEmailMutation = useSendOrderInvoiceEmail({
    success: t("invoiceEmailSent"),
    error: t("invoiceEmailFailed"),
  });

  const headers = [
    t("invoiceNumber"),
    t("statusLabel"),
    t("linkedRecord"),
    t("currencyTotal"),
    t("sentDownloaded"),
  ];

  const refreshInvoiceHistory = () => {
    queryClient.invalidateQueries({
      queryKey: ["reports", "generated-invoices"],
    });
  };

  if (loading) {
    return <TableSkeleton headers={headers} rows={6} showActions />;
  }

  if (!invoices.length) {
    return (
      <EmptyState
        title={t("invoiceHistoryEmptyTitle")}
        description={t("invoiceHistoryEmptyDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden max-w-full overflow-hidden lg:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[24%]">{t("invoiceNumber")}</TableHead>
              <TableHead className="w-[14%]">{t("statusLabel")}</TableHead>
              <TableHead className="w-[27%]">{t("linkedRecord")}</TableHead>
              <TableHead className="w-[14%]">{t("currencyTotal")}</TableHead>
              <TableHead className="w-[13%]">{t("sentDownloaded")}</TableHead>
              <TableHead className="w-20 text-center">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const orderId = invoice.orderId || undefined;
              const isDownloading =
                downloadInvoiceMutation.isPending &&
                downloadInvoiceMutation.variables?.orderId === orderId;
              const isSending =
                sendInvoiceEmailMutation.isPending &&
                sendInvoiceEmailMutation.variables?.orderId === orderId;
              const invoiceRestaurantId =
                invoice.restaurantId || user?.restaurantId || undefined;
              const invoiceBranchId =
                invoice.branchId ||
                (isBranchAdmin ? branchId : undefined) ||
                undefined;
              const actionParams = {
                restaurantId: invoiceRestaurantId,
                branchId: invoiceBranchId,
              };

              return (
                <TableRow key={invoice.id} className="h-[70px] border-none">
                  <TableCell className="px-4">
                    <div className="min-w-0 space-y-1">
                      <p
                        className="truncate font-medium text-gray-700"
                        title={invoice.invoiceNumber || invoice.id}
                      >
                        {invoice.invoiceNumber || "-"}
                      </p>
                      <p
                        className="truncate text-sm text-gray-500"
                        title={invoice.id}
                      >
                        {invoice.id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge
                      variant="outline"
                      className={getStatusClassName(invoice.status)}
                    >
                      {prettyLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="min-w-0 space-y-1 text-sm">
                      <p
                        className="truncate font-medium text-gray-700"
                        title={orderId}
                      >
                        {invoice.orderId
                          ? `${t("orderId")}: ${invoice.orderId}`
                          : "-"}
                      </p>
                      {invoice.subscriptionId ? (
                        <p
                          className="truncate text-xs text-gray-500"
                          title={invoice.subscriptionId}
                        >
                          {t("subscriptionId")}: {invoice.subscriptionId}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 font-medium text-gray-700">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-gray-500">
                    {t("sentDownloadedValue", {
                      sent: invoice.sentCount ?? 0,
                      downloaded: invoice.downloadedCount ?? 0,
                    })}
                  </TableCell>
                  <TableCell className="px-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("downloadInvoice")}
                        aria-label={t("downloadInvoice")}
                        disabled={
                          !orderId || !invoiceRestaurantId || isDownloading
                        }
                        onClick={() => {
                          if (!orderId || !invoiceRestaurantId) return;
                          downloadInvoiceMutation.mutate(
                            {
                              orderId,
                              orderNumber: invoice.invoiceNumber,
                              params: actionParams,
                            },
                            { onSettled: refreshInvoiceHistory },
                          );
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("sendInvoiceEmail")}
                        aria-label={t("sendInvoiceEmail")}
                        disabled={!orderId || !invoiceRestaurantId || isSending}
                        onClick={() => {
                          if (!orderId || !invoiceRestaurantId) return;
                          sendInvoiceEmailMutation.mutate(
                            {
                              orderId,
                              params: actionParams,
                            },
                            { onSettled: refreshInvoiceHistory },
                          );
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {invoices.map((invoice) => {
          const orderId = invoice.orderId || undefined;
          const invoiceRestaurantId =
            invoice.restaurantId || user?.restaurantId || undefined;
          const invoiceBranchId =
            invoice.branchId ||
            (isBranchAdmin ? branchId : undefined) ||
            undefined;
          const actionParams = {
            restaurantId: invoiceRestaurantId,
            branchId: invoiceBranchId,
          };

          return (
            <div
              key={invoice.id}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-800">
                    {invoice.invoiceNumber || "-"}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {invoice.orderId
                      ? `${t("orderId")}: ${invoice.orderId}`
                      : "-"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusClassName(invoice.status)}
                >
                  {prettyLabel(invoice.status)}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-gray-800">
                  {formatMoney(invoice.totalAmount, invoice.currency)}
                </span>
                <span className="text-gray-500">
                  {t("sentDownloadedValue", {
                    sent: invoice.sentCount ?? 0,
                    downloaded: invoice.downloadedCount ?? 0,
                  })}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={t("downloadInvoice")}
                  aria-label={t("downloadInvoice")}
                  disabled={!orderId || !invoiceRestaurantId}
                  onClick={() => {
                    if (!orderId || !invoiceRestaurantId) return;
                    downloadInvoiceMutation.mutate(
                      {
                        orderId,
                        orderNumber: invoice.invoiceNumber,
                        params: actionParams,
                      },
                      { onSettled: refreshInvoiceHistory },
                    );
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={t("sendInvoiceEmail")}
                  aria-label={t("sendInvoiceEmail")}
                  disabled={!orderId || !invoiceRestaurantId}
                  onClick={() => {
                    if (!orderId || !invoiceRestaurantId) return;
                    sendInvoiceEmailMutation.mutate(
                      {
                        orderId,
                        params: actionParams,
                      },
                      { onSettled: refreshInvoiceHistory },
                    );
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
