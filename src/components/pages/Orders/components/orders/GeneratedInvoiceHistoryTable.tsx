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

interface GeneratedInvoiceHistoryTableProps {
  invoices: GeneratedInvoice[];
  loading: boolean;
}

export function GeneratedInvoiceHistoryTable({
  invoices,
  loading,
}: GeneratedInvoiceHistoryTableProps) {
  const t = useTranslations("orders");
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
            <TableHead>{t("linkedRecord")}</TableHead>
            <TableHead>{t("currencyTotal")}</TableHead>
            <TableHead>{t("sentDownloaded")}</TableHead>
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
              <TableRow key={invoice.id}>
                <TableCell className="font-medium text-dark">
                  {invoice.invoiceNumber || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === "SENT" ? "default" : "secondary"
                    }
                  >
                    {prettyLabel(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p>
                      {invoice.orderId
                        ? `${t("orderId")}: ${invoice.orderId}`
                        : "-"}
                    </p>
                    {invoice.subscriptionId ? (
                      <p className="text-xs text-gray-500">
                        {t("subscriptionId")}: {invoice.subscriptionId}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {formatMoney(invoice.totalAmount, invoice.currency)}
                </TableCell>
                <TableCell>
                  {t("sentDownloadedValue", {
                    sent: invoice.sentCount ?? 0,
                    downloaded: invoice.downloadedCount ?? 0,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
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
                        downloadInvoiceMutation.mutate({
                          orderId,
                          orderNumber: invoice.invoiceNumber,
                          params: actionParams,
                        });
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
                        sendInvoiceEmailMutation.mutate({
                          orderId,
                          params: actionParams,
                        });
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
  );
}
