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
import TabButton from "@/components/ui/TabButton";
import OrdersGraph from "@/components/pages/Reports/components/graphs/orders-graph";
import type { TrendRange } from "@/components/pages/Reports/components/graphs/orders-graph";
import { GeneratedInvoiceHistoryTable } from "@/components/pages/Orders/components/orders/GeneratedInvoiceHistoryTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  isValidCustomReportPeriod,
  resolveReportDateRange,
  type CustomReportPeriod,
} from "@/components/pages/reports/utils/report-date-range";

export default function Orders() {
  const t = useTranslations("reports");
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    restaurantId,
    branchId,
    isBranchAdmin,
    loading: authLoading,
  } = useAuth();
  const { currency: fallbackCurrency } = useCurrency(restaurantId);
  const { restaurant } = useBranding();
  const scopedReportParams = restaurantId
    ? {
        restaurantId,
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
  } = useGetFinancialReport(
    scopedReportParams
      ? { ...scopedReportParams, ...reportDateRange }
      : undefined,
  );

  const {
    data: ordersReportResponse,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
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

  const activeLoading =
    authLoading ||
    (activeTab === "invoice-history"
      ? subscriptionInvoicesQuery.isLoading ||
        subscriptionInvoicesQuery.isFetching
      : activeTab === "financial"
        ? financialLoading || financialFetching
        : ordersLoading || ordersFetching);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Header title={title} description={description} />

        <div className="flex flex-col gap-3 sm:flex-row">
          {activeTab !== "invoice-history" ? (
            <Button
              type="button"
              variant="outline"
              disabled={activeLoading || !restaurantId}
              onClick={handleDownloadActiveReportPdf}
              className="h-[44px] rounded-[12px] border-gray-200 px-5 text-gray-700"
            >
              <Download size={17} className="mr-2" />
              {t("downloadPdf")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <div className="flex items-center gap-6">
          <TabButton
            active={activeTab === "financial"}
            onClick={() => handleTabChange("financial")}
          >
            {t("tabs.financial")}
          </TabButton>

          <TabButton
            active={activeTab === "order"}
            onClick={() => handleTabChange("order")}
          >
            {t("tabs.orders")}
          </TabButton>

          <TabButton
            active={activeTab === "invoice-history"}
            onClick={() => handleTabChange("invoice-history")}
          >
            {t("tabs.invoiceHistory")}
          </TabButton>
        </div>

        {activeTab !== "invoice-history" ? (
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-end">
            <div className="flex items-center gap-2 pb-1 text-sm font-medium text-gray-700 lg:mr-2">
              <CalendarDays size={18} />
              {t("customPeriod")}
            </div>
            <label className="grid gap-1 text-xs font-medium text-gray-600">
              {t("fromDate")}
              <Input
                type="date"
                value={draftCustomPeriod.from}
                max={draftCustomPeriod.to || undefined}
                onChange={(event) =>
                  setDraftCustomPeriod((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className="h-10 bg-white"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-gray-600">
              {t("toDate")}
              <Input
                type="date"
                value={draftCustomPeriod.to}
                min={draftCustomPeriod.from || undefined}
                onChange={(event) =>
                  setDraftCustomPeriod((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className="h-10 bg-white"
              />
            </label>
            <Button
              type="button"
              onClick={handleApplyCustomPeriod}
              className="h-10"
            >
              {t("applyPeriod")}
            </Button>
            {customPeriod ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetCustomPeriod}
                className="h-10"
              >
                {t("resetPeriod")}
              </Button>
            ) : null}
            {customPeriod ? (
              <p className="text-sm text-gray-600 lg:ml-auto lg:pb-2">
                {t("selectedPeriod", {
                  from: customPeriod.from,
                  to: customPeriod.to,
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        {activeTab === "invoice-history" ? (
          <GeneratedInvoiceHistoryTable
            invoices={billingInvoices}
            loading={activeLoading}
            mode="billing"
          />
        ) : activeTab === "financial" ? (
          <>
            <StatsSection
              stats={activeStats}
              loading={activeLoading}
              className="xl:grid-cols-4"
            />

            <RevenueAnalytics range={range} onRangeChange={handleRangeChange} />
          </>
        ) : (
          <>
            <StatsSection
              stats={activeStats}
              loading={activeLoading}
              className="xl:grid-cols-4"
            />

            <OrdersGraph range={range} onRangeChange={handleRangeChange} />
          </>
        )}
      </div>
    </Container>
  );
}
