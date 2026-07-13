"use client";

import { Download, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { useDownloadOrderInvoicePdf, useSendOrderInvoiceEmail } from "@/hooks/useOrders";
import { formatDateTime24 } from "@/lib/date-time-format";
import type { GeneratedInvoice } from "@/services/reports/reports.api";

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return formatDateTime24({
    value: date,
    options: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  });
};

const formatPeriod = (from?: string | null, to?: string | null) => {
  if (!from && !to) return "-";

  const formatPeriodDate = (value?: string | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString();
  };

  return `${formatPeriodDate(from)} – ${formatPeriodDate(to)}`;
};

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
  value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "-";

interface GeneratedInvoiceHistoryTableProps {
  invoices: GeneratedInvoice[];
  loading: boolean;
}

export function GeneratedInvoiceHistoryTable({
  invoices,
  loading,
}: GeneratedInvoiceHistoryTableProps) {
  const t = useTranslations("orders");
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
    t("restaurant"),
    t("branch"),
    t("linkedRecord"),
    t("period"),
    t("currencyTotal"),
    t("sentDownloaded"),
    t("lastSent"),
    t("documentType"),
  ];

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
    <div className="overflow-x-auto rounded-[14px] border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("invoiceNumber")}</TableHead>
            <TableHead>{t("statusLabel")}</TableHead>
            <TableHead>{t("restaurant")}</TableHead>
            <TableHead>{t("branch")}</TableHead>
            <TableHead>{t("linkedRecord")}</TableHead>
            <TableHead>{t("period")}</TableHead>
            <TableHead>{t("currencyTotal")}</TableHead>
            <TableHead>{t("sentDownloaded")}</TableHead>
            <TableHead>{t("lastSent")}</TableHead>
            <TableHead>{t("documentType")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
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

            return (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium text-dark">
                  {invoice.invoiceNumber || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={invoice.status === "SENT" ? "default" : "secondary"}>
                    {prettyLabel(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.restaurant?.name || invoice.tenant?.name || "-"}</TableCell>
                <TableCell>{invoice.branch?.name || "-"}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p>{invoice.orderId ? `${t("orderId")}: ${invoice.orderId}` : "-"}</p>
                    {invoice.subscriptionId ? (
                      <p className="text-xs text-gray-500">
                        {t("subscriptionId")}: {invoice.subscriptionId}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatPeriod(invoice.periodFrom, invoice.periodTo)}</TableCell>
                <TableCell>{formatMoney(invoice.totalAmount, invoice.currency)}</TableCell>
                <TableCell>
                  {t("sentDownloadedValue", {
                    sent: invoice.sentCount ?? 0,
                    downloaded: invoice.downloadedCount ?? 0,
                  })}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p>{formatDate(invoice.lastSentAt)}</p>
                    {invoice.lastSentTo ? (
                      <p className="text-xs text-gray-500">{invoice.lastSentTo}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{prettyLabel(invoice.documentType || invoice.kind)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!orderId || isDownloading}
                      onClick={() => {
                        if (!orderId) return;
                        downloadInvoiceMutation.mutate({
                          orderId,
                          orderNumber: invoice.invoiceNumber,
                        });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isDownloading ? t("downloadingInvoice") : t("downloadInvoice")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!orderId || isSending}
                      onClick={() => {
                        if (!orderId) return;
                        sendInvoiceEmailMutation.mutate({ orderId });
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isSending ? t("sendingInvoiceEmail") : t("sendInvoiceEmail")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
