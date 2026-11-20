"use client";

import { Download, Eye, Loader2, Mail, Search } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useGetGeneratedInvoices } from "@/hooks/useReports";
import {
  downloadGeneratedInvoicePdf,
  type GeneratedInvoice,
} from "@/services/reports/reports.api";
import {
  buildBillingInvoiceParams,
  buildGeneratedInvoiceActionParams,
  getGeneratedInvoiceStatusTone,
  getInvoiceDownloads,
  getInvoiceLinkedRecord,
  getInvoiceSnapshotName,
  isRestaurantBillingInvoice,
  numericInvoiceValue,
  type BillingInvoiceFilters,
} from "./generated-invoice-history.helpers";

interface GeneratedInvoiceHistoryTableProps {
  invoices?: GeneratedInvoice[];
  loading?: boolean;
  mode?: "orders" | "billing";
  restaurantId?: string | null;
  branchId?: string | null;
}

const initialFilters: BillingInvoiceFilters = {
  kind: "ALL",
  status: "ALL",
  fromDate: "",
  toDate: "",
};

export function GeneratedInvoiceHistoryTable({
  invoices: providedInvoices = [],
  loading = false,
  mode = "orders",
  restaurantId,
  branchId: scopedBranchId,
}: GeneratedInvoiceHistoryTableProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { user, branchId, isBranchAdmin } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    string | null
  >(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const params = buildBillingInvoiceParams({
    filters,
    restaurantId: restaurantId || user?.restaurantId,
    branchId: scopedBranchId || (isBranchAdmin ? branchId : null),
  });
  const billingQuery = useGetGeneratedInvoices(params, {
    enabled: mode === "billing" && Boolean(params.restaurantId),
  });
  const invoices =
    mode === "billing"
      ? (billingQuery.data?.data || []).filter(isRestaurantBillingInvoice)
      : providedInvoices;
  const isLoading =
    mode === "billing"
      ? billingQuery.isLoading || billingQuery.isFetching
      : loading;
  const sendInvoiceEmailMutation = useSendOrderInvoiceEmail({
    success: t("invoiceEmailSent"),
    error: t("invoiceEmailFailed"),
  });

  const formatDate = (value?: string | null, withTime = false) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      ...(withTime ? { timeStyle: "short" as const } : {}),
    }).format(date);
  };
  const money = (invoice: GeneratedInvoice) => {
    const amount = numericInvoiceValue(invoice.totalAmount);
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: invoice.currency || "EUR",
      }).format(amount);
    } catch {
      return `${amount.toLocaleString(locale)} ${invoice.currency || "EUR"}`;
    }
  };
  const label = (value?: string | null) =>
    value
      ? value
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "-";
  const kindLabel = (kind?: string | null) =>
    kind === "SUBSCRIPTION"
      ? t("subscriptionInvoice")
      : kind === "WEEKLY_PAYOUT"
        ? t("weeklyPayoutInvoice")
        : kind === "ORDER"
          ? t("orderInvoice")
          : label(kind);
  const statusLabel = (status?: string | null) => {
    const key = status?.toLowerCase();
    return key &&
      [
        "draft",
        "generated",
        "issued",
        "sent",
        "paid",
        "failed",
        "void",
        "cancelled",
      ].includes(key)
      ? t(`invoiceStatuses.${key}`)
      : label(status);
  };
  const statusClass = (status?: string | null) =>
    ({
      success: "border-emerald-100 bg-emerald-50 text-emerald-700",
      danger: "border-red-100 bg-red-50 text-red-700",
      neutral: "border-slate-200 bg-slate-50 text-slate-600",
      warning: "border-amber-100 bg-amber-50 text-amber-700",
    })[getGeneratedInvoiceStatusTone(status)];
  const refresh = () =>
    void queryClient.invalidateQueries({
      queryKey: ["reports", "generated-invoices"],
    });

  const actionParams = (invoice: GeneratedInvoice) =>
    buildGeneratedInvoiceActionParams({
      invoice,
      restaurantId: restaurantId || user?.restaurantId,
      branchId: scopedBranchId || (isBranchAdmin ? branchId : null),
    });
  const handleDownload = async (invoice: GeneratedInvoice) => {
    setDownloadingInvoiceId(invoice.id);
    try {
      const blob = await downloadGeneratedInvoicePdf(
        invoice.id,
        actionParams(invoice),
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber || invoice.id}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t("invoiceDownloaded"));
      refresh();
    } catch {
      toast.error(t("invoiceDownloadFailed"));
    } finally {
      setDownloadingInvoiceId(null);
    }
  };
  const handleView = async (invoice: GeneratedInvoice) => {
    setViewingInvoiceId(invoice.id);
    const openedWindow = window.open("", "_blank");
    try {
      if (!openedWindow) {
        toast.error(t("invoiceViewFailed"));
        return;
      }
      openedWindow.opener = null;
      const blob = await downloadGeneratedInvoicePdf(
        invoice.id,
        actionParams(invoice),
      );
      const url = URL.createObjectURL(blob);
      openedWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      refresh();
    } catch {
      openedWindow?.close();
      toast.error(t("invoiceViewFailed"));
    } finally {
      setViewingInvoiceId(null);
    }
  };

  const renderActions = (invoice: GeneratedInvoice, mobile = false) => {
    const restaurant = actionParams(invoice).restaurantId;
    const orderId = invoice.orderId || undefined;
    const isViewing = viewingInvoiceId === invoice.id;
    const isDownloading = downloadingInvoiceId === invoice.id;
    return (
      <div
        className={mobile ? "grid grid-cols-2 gap-2" : "flex justify-end gap-2"}
      >
        <Button
          type="button"
          variant="outline"
          size={mobile ? "default" : "icon"}
          className={mobile ? "min-h-11" : ""}
          aria-label={t("viewInvoice")}
          title={t("viewInvoice")}
          disabled={!restaurant || isViewing}
          onClick={() => void handleView(invoice)}
        >
          {isViewing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Eye className="size-4" />
          )}
          {mobile ? <span className="ml-2">{t("viewInvoice")}</span> : null}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={mobile ? "default" : "icon"}
          className={mobile ? "min-h-11" : ""}
          aria-label={t("downloadInvoice")}
          title={t("downloadInvoice")}
          disabled={!restaurant || isDownloading}
          onClick={() => void handleDownload(invoice)}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {mobile ? <span className="ml-2">{t("downloadInvoice")}</span> : null}
        </Button>
        {mode === "orders" ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("sendInvoiceEmail")}
            title={t("sendInvoiceEmail")}
            disabled={!orderId || !restaurant}
            onClick={() =>
              orderId &&
              restaurant &&
              sendInvoiceEmailMutation.mutate(
                { orderId, params: actionParams(invoice) },
                { onSettled: refresh },
              )
            }
          >
            <Mail className="size-4" />
          </Button>
        ) : null}
      </div>
    );
  };

  if (mode === "orders" && isLoading)
    return (
      <TableSkeleton
        headers={[
          t("invoiceNumber"),
          t("statusLabel"),
          t("linkedRecord"),
          t("currencyTotal"),
        ]}
        rows={6}
        showActions
      />
    );

  return (
    <div className="space-y-4">
      {mode === "billing" ? (
        <section
          className="rounded-2xl border border-[#EEF0F4] bg-[#FAFBFC] p-4"
          aria-labelledby="generated-invoice-filters-title"
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="size-5" />
            </div>
            <div>
              <h2
                id="generated-invoice-filters-title"
                className="font-semibold text-dark"
              >
                {t("generatedHistory.title")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("generatedHistory.description")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label={t("generatedHistory.kind")}
              value={filters.kind}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  kind: value as BillingInvoiceFilters["kind"],
                }))
              }
              options={[
                { value: "ALL", label: t("generatedHistory.allKinds") },
                { value: "SUBSCRIPTION", label: t("subscriptionInvoice") },
                { value: "WEEKLY_PAYOUT", label: t("weeklyPayoutInvoice") },
              ]}
            />
            <FilterSelect
              label={t("generatedHistory.status")}
              value={filters.status}
              onChange={(value) =>
                setFilters((current) => ({ ...current, status: value }))
              }
              options={[
                "ALL",
                "DRAFT",
                "GENERATED",
                "ISSUED",
                "SENT",
                "PAID",
                "FAILED",
                "CANCELLED",
                "VOID",
              ].map((value) => ({
                value,
                label:
                  value === "ALL"
                    ? t("generatedHistory.allStatuses")
                    : statusLabel(value),
              }))}
            />
            <DateFilter
              label={t("generatedHistory.fromDate")}
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={(value) =>
                setFilters((current) => ({ ...current, fromDate: value }))
              }
            />
            <DateFilter
              label={t("generatedHistory.toDate")}
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={(value) =>
                setFilters((current) => ({ ...current, toDate: value }))
              }
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setFilters(initialFilters)}
            >
              {t("generatedHistory.clear")}
            </Button>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F4] bg-white text-gray-500">
          <Loader2 className="size-5 animate-spin" />
          {t("generatedHistory.loading")}
        </div>
      ) : !invoices.length ? (
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
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#EEF0F4] bg-white lg:block">
            <Table
              className={mode === "billing" ? "min-w-[1320px]" : "table-fixed"}
            >
              <TableHeader className="bg-[#F8FAFC]">
                <TableRow>
                  {mode === "billing" ? (
                    <>
                      <TableHead>{t("generatedHistory.invoice")}</TableHead>
                      <TableHead>{t("generatedHistory.kind")}</TableHead>
                      <TableHead>{t("generatedHistory.status")}</TableHead>
                      <TableHead>{t("generatedHistory.scope")}</TableHead>
                      <TableHead>{t("generatedHistory.linkedId")}</TableHead>
                      <TableHead>{t("period")}</TableHead>
                      <TableHead className="text-right">
                        {t("generatedHistory.total")}
                      </TableHead>
                      <TableHead>{t("generatedHistory.activity")}</TableHead>
                      <TableHead>{t("documentType")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>{t("invoiceNumber")}</TableHead>
                      <TableHead>{t("statusLabel")}</TableHead>
                      <TableHead>{t("linkedRecord")}</TableHead>
                      <TableHead>{t("currencyTotal")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const linked = getInvoiceLinkedRecord(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      {mode === "billing" ? (
                        <>
                          <TableCell>
                            <p className="font-semibold text-dark">
                              {invoice.invoiceNumber || invoice.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("generatedHistory.generated", {
                                date: formatDate(
                                  invoice.generatedAt || invoice.createdAt,
                                ),
                              })}
                            </p>
                          </TableCell>
                          <TableCell>{kindLabel(invoice.kind)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusClass(invoice.status)}
                            >
                              {statusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-64 space-y-1 text-sm">
                              <p>
                                {t("generatedHistory.tenant")}:{" "}
                                {getInvoiceSnapshotName(invoice, "tenant")}
                              </p>
                              <p>
                                {t("generatedHistory.restaurant")}:{" "}
                                {getInvoiceSnapshotName(invoice, "restaurant")}
                              </p>
                              <p>
                                {t("generatedHistory.branch")}:{" "}
                                {getInvoiceSnapshotName(invoice, "branch")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {linked ? (
                              <div>
                                <p className="text-xs text-gray-500">
                                  {t(`generatedHistory.${linked.type}`)}
                                </p>
                                <p
                                  className="max-w-40 truncate font-medium"
                                  title={linked.id}
                                >
                                  {linked.id}
                                </p>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(invoice.periodFrom)} –{" "}
                            {formatDate(invoice.periodTo)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {money(invoice)}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {t("sentDownloadedValue", {
                                sent: numericInvoiceValue(invoice.sentCount),
                                downloaded: getInvoiceDownloads(invoice),
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("generatedHistory.lastSentValue", {
                                date: formatDate(invoice.lastSentAt, true),
                                email: invoice.lastSentTo || "-",
                              })}
                            </p>
                          </TableCell>
                          <TableCell>
                            {label(
                              invoice.documentType || invoice.mimeType || "PDF",
                            )}
                          </TableCell>
                          <TableCell>{renderActions(invoice)}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <p className="font-medium">
                              {invoice.invoiceNumber || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {invoice.id}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusClass(invoice.status)}
                            >
                              {statusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.orderId || "-"}</TableCell>
                          <TableCell className="font-medium">
                            {money(invoice)}
                          </TableCell>
                          <TableCell>{renderActions(invoice)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 lg:hidden">
            {invoices.map((invoice) => {
              const linked = getInvoiceLinkedRecord(invoice);
              return (
                <article
                  key={invoice.id}
                  className="space-y-4 rounded-2xl border border-[#EEF0F4] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-dark">
                        {invoice.invoiceNumber || invoice.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {kindLabel(invoice.kind)} ·{" "}
                        {formatDate(invoice.generatedAt || invoice.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusClass(invoice.status)}
                    >
                      {statusLabel(invoice.status)}
                    </Badge>
                  </div>
                  {mode === "billing" ? (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <MobileValue
                        label={t("generatedHistory.restaurant")}
                        value={getInvoiceSnapshotName(invoice, "restaurant")}
                      />
                      <MobileValue
                        label={t("generatedHistory.branch")}
                        value={getInvoiceSnapshotName(invoice, "branch")}
                      />
                      <MobileValue
                        label={t("generatedHistory.linkedId")}
                        value={linked?.id || "-"}
                      />
                      <MobileValue
                        label={t("period")}
                        value={`${formatDate(invoice.periodFrom)} – ${formatDate(invoice.periodTo)}`}
                      />
                      <MobileValue
                        label={t("generatedHistory.total")}
                        value={money(invoice)}
                      />
                      <MobileValue
                        label={t("documentType")}
                        value={label(
                          invoice.documentType || invoice.mimeType || "PDF",
                        )}
                      />
                      <MobileValue
                        label={t("generatedHistory.activity")}
                        value={t("sentDownloadedValue", {
                          sent: numericInvoiceValue(invoice.sentCount),
                          downloaded: getInvoiceDownloads(invoice),
                        })}
                        wide
                      />
                    </dl>
                  ) : null}
                  {renderActions(invoice, true)}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-dark">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-h-11 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
function DateFilter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-dark">
      {label}
      <Input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 bg-white"
      />
    </label>
  );
}
function MobileValue({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-dark">{value}</dd>
    </div>
  );
}
