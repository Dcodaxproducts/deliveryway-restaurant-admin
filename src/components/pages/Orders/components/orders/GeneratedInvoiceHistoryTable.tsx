"use client";

import { Download, Eye, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { useSendOrderInvoiceEmail } from "@/hooks/useOrders";
import {
  downloadGeneratedInvoicePdf,
  type GeneratedInvoice,
} from "@/services/reports/reports.api";

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
  mode?: "orders" | "billing";
}

export function GeneratedInvoiceHistoryTable({
  invoices,
  loading,
  mode = "orders",
}: GeneratedInvoiceHistoryTableProps) {
  const t = useTranslations("orders");
  const queryClient = useQueryClient();
  const { user, branchId, isBranchAdmin } = useAuth();
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    string | null
  >(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const sendInvoiceEmailMutation = useSendOrderInvoiceEmail({
    success: t("invoiceEmailSent"),
    error: t("invoiceEmailFailed"),
  });
  const getInvoiceKindLabel = (kind?: string | null) => {
    if (kind === "SUBSCRIPTION") return t("subscriptionInvoice");
    if (kind === "WEEKLY_PAYOUT") return t("weeklyPayoutInvoice");
    if (kind === "ORDER") return t("orderInvoice");
    return prettyLabel(kind);
  };
  const getInvoiceStatusLabel = (status?: string | null) => {
    if (status === "ISSUED") return t("invoiceStatuses.issued");
    if (status === "SENT") return t("invoiceStatuses.sent");
    if (status === "PAID") return t("invoiceStatuses.paid");
    if (status === "FAILED") return t("invoiceStatuses.failed");
    if (status === "VOID") return t("invoiceStatuses.void");
    if (status === "CANCELLED") return t("invoiceStatuses.cancelled");
    return prettyLabel(status);
  };

  const headers = [
    t("invoiceNumber"),
    t("statusLabel"),
    t("linkedRecord"),
    t("currencyTotal"),
  ];

  const refreshInvoiceHistory = () => {
    queryClient.invalidateQueries({
      queryKey: ["reports", "generated-invoices"],
    });
  };

  const handleDownload = async (
    invoice: GeneratedInvoice,
    params: { restaurantId?: string; branchId?: string; kind?: string },
  ) => {
    setDownloadingInvoiceId(invoice.id);

    try {
      const blob = await downloadGeneratedInvoicePdf(invoice.id, params);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber || invoice.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t("invoiceDownloaded"));
      refreshInvoiceHistory();
    } catch {
      toast.error(t("invoiceDownloadFailed"));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleView = async (
    invoice: GeneratedInvoice,
    params: { restaurantId?: string; branchId?: string; kind?: string },
  ) => {
    setViewingInvoiceId(invoice.id);
    const openedWindow = window.open("", "_blank");

    try {
      if (!openedWindow) {
        toast.error(t("invoiceViewFailed"));
        return;
      }

      openedWindow.opener = null;
      const blob = await downloadGeneratedInvoicePdf(invoice.id, params);
      const url = URL.createObjectURL(blob);
      openedWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      refreshInvoiceHistory();
    } catch {
      openedWindow?.close();
      toast.error(t("invoiceViewFailed"));
    } finally {
      setViewingInvoiceId(null);
    }
  };

  if (loading) {
    return <TableSkeleton headers={headers} rows={6} showActions />;
  }

  if (!invoices.length) {
    return (
      <EmptyState
        title={t(
          mode === "billing"
            ? "billingInvoiceHistoryEmptyTitle"
            : "invoiceHistoryEmptyTitle",
        )}
        description={t(
          mode === "billing"
            ? "billingInvoiceHistoryEmptyDescription"
            : "invoiceHistoryEmptyDescription",
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden max-w-full overflow-hidden lg:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="w-[28%]">{t("invoiceNumber")}</TableHead>
              <TableHead className="w-[14%]">{t("statusLabel")}</TableHead>
              <TableHead className="w-[34%]">{t("linkedRecord")}</TableHead>
              <TableHead className="w-[16%]">{t("currencyTotal")}</TableHead>
              <TableHead className="w-20 text-center">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const orderId = invoice.orderId || undefined;
              const isDownloading = downloadingInvoiceId === invoice.id;
              const isViewing = viewingInvoiceId === invoice.id;
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
                kind: invoice.kind || undefined,
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
                      {getInvoiceStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="min-w-0 space-y-1 text-sm">
                      <p className="truncate font-medium text-gray-700">
                        {mode === "billing"
                          ? `${t("invoiceType")}: ${getInvoiceKindLabel(invoice.kind)}`
                          : invoice.orderId
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
                      {mode === "billing" &&
                      (invoice.periodFrom || invoice.periodTo) ? (
                        <p className="truncate text-xs text-gray-500">
                          {t("billingPeriod")}:{" "}
                          {[invoice.periodFrom, invoice.periodTo]
                            .filter(Boolean)
                            .map((value) =>
                              new Date(String(value)).toLocaleDateString(),
                            )
                            .join(" – ")}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 font-medium text-gray-700">
                    {formatMoney(invoice.totalAmount, invoice.currency)}
                  </TableCell>
                  <TableCell className="px-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("viewInvoice")}
                        aria-label={t("viewInvoice")}
                        disabled={!invoiceRestaurantId || isViewing}
                        onClick={() => {
                          if (!invoiceRestaurantId) return;
                          void handleView(invoice, actionParams);
                        }}
                      >
                        {isViewing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("downloadInvoice")}
                        aria-label={t("downloadInvoice")}
                        disabled={!invoiceRestaurantId || isDownloading}
                        onClick={() => {
                          if (!invoiceRestaurantId) return;
                          void handleDownload(invoice, actionParams);
                        }}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      {mode === "orders" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title={t("sendInvoiceEmail")}
                          aria-label={t("sendInvoiceEmail")}
                          disabled={
                            !orderId || !invoiceRestaurantId || isSending
                          }
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
                      ) : null}
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
                    {mode === "billing"
                      ? `${t("invoiceType")}: ${getInvoiceKindLabel(invoice.kind)}`
                      : invoice.orderId
                        ? `${t("orderId")}: ${invoice.orderId}`
                        : "-"}
                  </p>
                  {invoice.subscriptionId ? (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {t("subscriptionId")}: {invoice.subscriptionId}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant="outline"
                  className={getStatusClassName(invoice.status)}
                >
                  {getInvoiceStatusLabel(invoice.status)}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-gray-800">
                  {formatMoney(invoice.totalAmount, invoice.currency)}
                </span>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={t("viewInvoice")}
                  aria-label={t("viewInvoice")}
                  disabled={
                    !invoiceRestaurantId || viewingInvoiceId === invoice.id
                  }
                  onClick={() => {
                    if (!invoiceRestaurantId) return;
                    void handleView(invoice, actionParams);
                  }}
                >
                  {viewingInvoiceId === invoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={t("downloadInvoice")}
                  aria-label={t("downloadInvoice")}
                  disabled={
                    !invoiceRestaurantId || downloadingInvoiceId === invoice.id
                  }
                  onClick={() => {
                    if (!invoiceRestaurantId) return;
                    void handleDownload(invoice, actionParams);
                  }}
                >
                  {downloadingInvoiceId === invoice.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                {mode === "orders" ? (
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
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
