"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import StatsSection from "@/components/common/stats-section";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import RevenueAnalytics from "@/components/pages/Dashboard/components/dashboard/revenue-trend-section";
import { PageTabs } from "@/components/common/PageTabs";
import { SectionCard } from "@/components/common/SectionCard";
import { FilterBar } from "@/components/common/FilterBar";
import { StatePanel } from "@/components/common/EmptyState";
import OrdersGraph from "@/components/pages/Reports/components/graphs/orders-graph";
import type { TrendRange } from "@/components/pages/Reports/components/graphs/orders-graph";
import { GeneratedInvoiceHistoryTable } from "@/components/pages/Orders/components/orders/GeneratedInvoiceHistoryTable";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/common/DateTimeInputs";
import { ReportSummaryError } from "@/components/pages/reports/components/report-summary-error";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useGetFinancialReport,
  useGetGeneratedInvoices,
  useGetOrdersReport,
} from "@/hooks/useReports";
import { downloadRestaurantDashboardReportPdf } from "@/components/pages/Reports/components/reports/restaurant-report-pdf";
import {
  buildFinancialStats,
  buildOrderReportStats,
  getReportCurrency,
  getReportHeaderContent,
  mergeRestaurantBillingInvoices,
  type ReportTab,
} from "@/components/pages/reports/utils/reports-page.helpers";
import {
  buildReportTrendParams,
  getPreviousCalendarMonthPeriod,
  isValidCustomReportPeriod,
  resolveReportDateRange,
  type CustomReportPeriod,
} from "@/components/pages/reports/utils/report-date-range";

export default function Orders() {
  const t = useTranslations("reports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    restaurantId,
    branchId,
    isBranchAdmin,
    scopedParams,
    loading: authLoading,
  } = useAuth();
  const { currency: fallbackCurrency } = useCurrency(restaurantId);
  const { restaurant } = useBranding();
  const scopedReportParams = user
    ? {
        ...scopedParams,
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      }
    : undefined;

  const [activeTab, setActiveTab] = useState<ReportTab>("financial");
  const [range, setRange] = useState<TrendRange>("daily");
  const [draftCustomPeriod, setDraftCustomPeriod] =
    useState<CustomReportPeriod>({ from: "", to: "" });
  const [customPeriod, setCustomPeriod] = useState<CustomReportPeriod | null>(
    null,
  );
  const reportDateRange = useMemo(
    () => resolveReportDateRange(range, customPeriod),
    [customPeriod, range],
  );
  const trendParams = scopedReportParams
    ? buildReportTrendParams(scopedReportParams, reportDateRange, range)
    : undefined;
  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (
      requestedTab === "financial" ||
      requestedTab === "order" ||
      requestedTab === "invoice-history"
    ) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);
  const {
    data: financialReportResponse,
    isLoading: financialLoading,
    isFetching: financialFetching,
    isError: financialError,
    refetch: refetchFinancialReport,
  } = useGetFinancialReport(
    scopedReportParams
      ? { ...scopedReportParams, ...reportDateRange }
      : undefined,
  );

  const {
    data: ordersReportResponse,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    isError: ordersError,
    refetch: refetchOrdersReport,
  } = useGetOrdersReport(
    scopedReportParams
      ? { ...scopedReportParams, ...reportDateRange }
      : undefined,
  );
  const subscriptionInvoicesQuery = useGetGeneratedInvoices(
    {
      restaurantId: restaurantId || undefined,
      branchId: isBranchAdmin ? branchId || undefined : undefined,
      kind: "SUBSCRIPTION",
    },
    {
      enabled: activeTab === "invoice-history" && Boolean(restaurantId),
    },
  );
  const billingInvoices = useMemo(
    () =>
      mergeRestaurantBillingInvoices(
        subscriptionInvoicesQuery.data?.data || [],
      ),
    [subscriptionInvoicesQuery.data?.data],
  );

  const financialData = financialReportResponse?.data;
  const ordersData = ordersReportResponse?.data;
  const reportCurrency = getReportCurrency(
    financialData,
    ordersData,
    fallbackCurrency,
  );

  const financialStats = useMemo(
    () => buildFinancialStats(financialData, reportCurrency, t),
    [financialData, reportCurrency, t],
  );

  const orderStats = useMemo(
    () => buildOrderReportStats(ordersData, reportCurrency, t),
    [ordersData, reportCurrency, t],
  );

  const { title, description } = getReportHeaderContent(
    activeTab,
    isBranchAdmin,
    t,
  );

  const activeStats = activeTab === "financial" ? financialStats : orderStats;

  const activeReportData =
    activeTab === "financial" ? financialData : ordersData;

  const activeReportError =
    activeTab === "financial" ? financialError : ordersError;
  const refetchActiveReport =
    activeTab === "financial" ? refetchFinancialReport : refetchOrdersReport;

  const activeLoading =
    authLoading ||
    (activeTab === "invoice-history"
      ? subscriptionInvoicesQuery.isLoading ||
        subscriptionInvoicesQuery.isFetching
      : activeTab === "financial"
        ? financialLoading || financialFetching
        : ordersLoading || ordersFetching);
  const activeError =
    activeTab === "invoice-history" && subscriptionInvoicesQuery.isError;

  const handleDownloadActiveReportPdf = () => {
    if (!restaurantId) {
      toast.error(t("restaurantUnavailable"));
      return;
    }

    if (activeTab === "invoice-history") {
      return;
    }

    downloadRestaurantDashboardReportPdf({
      reportType: activeTab,
      title,
      description,
      restaurantId,
      restaurantName: restaurant.name,
      currency: reportCurrency,
      period: reportDateRange,
      stats: activeStats.map((stat) => ({
        title: stat.title,
        value: String(stat.value ?? "-"),
        description: stat.trend?.percentage,
      })),
      data: activeReportData,
    });

    toast.success(t("pdfDownloaded", { title }));
  };

  const handleApplyCustomPeriod = () => {
    if (!isValidCustomReportPeriod(draftCustomPeriod)) {
      toast.error(t("invalidCustomPeriod"));
      return;
    }

    setCustomPeriod(draftCustomPeriod);
  };

  const handleResetCustomPeriod = () => {
    setDraftCustomPeriod({ from: "", to: "" });
    setCustomPeriod(null);
  };

  const handleLastMonth = () => {
    const previousMonth = getPreviousCalendarMonthPeriod();
    setDraftCustomPeriod(previousMonth);
    setCustomPeriod(previousMonth);
  };

  const handleRangeChange = (nextRange: TrendRange) => {
    setRange(nextRange);
    setCustomPeriod(null);
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    router.replace(`/reports?tab=${tab}`, { scroll: false });
  };

  return (
    <Container>
      <Header
        title={title}
        description={description}
        actions={
          activeTab !== "invoice-history" ? (
            <Button
              type="button"
              variant="outline"
              disabled={activeLoading || !restaurantId}
              onClick={handleDownloadActiveReportPdf}
            >
              <Download size={17} className="mr-2" />
              {t("downloadPdf")}
            </Button>
          ) : null
        }
      />

      <SectionCard className="space-y-5" padding="md">
        <PageTabs
          value={activeTab}
          ariaLabel={title}
          options={[
            { value: "financial", label: t("tabs.financial") },
            { value: "order", label: t("tabs.orders") },
            { value: "invoice-history", label: t("tabs.invoiceHistory") },
          ]}
          onValueChange={handleTabChange}
        />

        {activeTab !== "invoice-history" ? (
          <FilterBar
            search={
              <div className="flex items-center gap-2 pb-2 text-sm font-medium text-[var(--ui-text-muted)] lg:pb-0">
                <CalendarDays size={18} />
                {t("customPeriod")}
              </div>
            }
            filters={
              <>
                <label className="grid gap-1 text-xs font-medium text-[var(--ui-text-muted)]">
                  {t("fromDate")}
                  <DatePickerInput
                    value={draftCustomPeriod.from}
                    max={draftCustomPeriod.to || undefined}
                    onChange={(value) =>
                      setDraftCustomPeriod((current) => ({
                        ...current,
                        from: value,
                      }))
                    }
                    ariaLabel={t("fromDate")}
                  />
                </label>
                <label className="grid gap-1 text-xs font-medium text-[var(--ui-text-muted)]">
                  {t("toDate")}
                  <DatePickerInput
                    value={draftCustomPeriod.to}
                    min={draftCustomPeriod.from || undefined}
                    onChange={(value) =>
                      setDraftCustomPeriod((current) => ({
                        ...current,
                        to: value,
                      }))
                    }
                    ariaLabel={t("toDate")}
                  />
                </label>
              </>
            }
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLastMonth}
                >
                  {t("lastMonth")}
                </Button>
                <Button type="button" onClick={handleApplyCustomPeriod}>
                  {t("applyPeriod")}
                </Button>
                {customPeriod ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetCustomPeriod}
                  >
                    {t("resetPeriod")}
                  </Button>
                ) : null}
              </>
            }
            resultCount={
              customPeriod
                ? t("selectedPeriod", {
                    from: customPeriod.from,
                    to: customPeriod.to,
                  })
                : undefined
            }
          />
        ) : null}

        {activeError ? (
          <StatePanel
            state="error"
            title={t("restaurantUnavailable")}
            description=""
          />
        ) : activeTab === "invoice-history" ? (
          <GeneratedInvoiceHistoryTable
            invoices={billingInvoices}
            loading={activeLoading}
            mode="billing"
          />
        ) : activeTab === "financial" ? (
          <>
            {activeReportError ? (
              <ReportSummaryError
                message={t("summaryLoadFailed")}
                retryLabel={t("retry")}
                onRetry={() => refetchActiveReport()}
              />
            ) : (
              <StatsSection stats={activeStats} loading={activeLoading} />
            )}

            <RevenueAnalytics
              range={range}
              onRangeChange={handleRangeChange}
              params={trendParams}
            />
          </>
        ) : (
          <>
            {activeReportError ? (
              <ReportSummaryError
                message={t("summaryLoadFailed")}
                retryLabel={t("retry")}
                onRetry={() => refetchActiveReport()}
              />
            ) : (
              <StatsSection stats={activeStats} loading={activeLoading} />
            )}

            <OrdersGraph
              range={range}
              onRangeChange={handleRangeChange}
              params={trendParams}
            />
          </>
        )}
      </SectionCard>
    </Container>
  );
}
