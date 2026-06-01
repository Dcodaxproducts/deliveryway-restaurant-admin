"use client";

import { useMemo, useState } from "react";
import { Download, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import StatsSection from "@/components/common/stats-section";
import Container from "@/components/common/Container";
import Header from "@/components/common/PageHeader";
import RevenueAnalytics from "@/components/pages/Dashboard/components/dashboard/revenue-trend-section";
import TabButton from "@/components/ui/TabButton";
import OrdersGraph from "@/components/pages/Reports/components/graphs/orders-graph";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetFinancialReport,
  useGetOrdersReport,
} from "@/hooks/useReports";
import RestaurantInvoicesModal from "@/components/pages/Reports/components/reports/RestaurantInvoicesModal";
import { downloadRestaurantDashboardReportPdf } from "@/components/pages/Reports/components/reports/restaurant-report-pdf";
import {
  buildFinancialStats,
  buildOrderReportStats,
  getReportCurrency,
  getReportHeaderContent,
  type ReportTab,
} from "@/components/pages/Reports/utils/reports-page.helpers";

export default function Orders() {
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const scopedReportParams = restaurantId
    ? {
        restaurantId,
        ...(isBranchAdmin && branchId ? { branchId } : {}),
      }
    : undefined;

  const [activeTab, setActiveTab] = useState<ReportTab>("financial");
  const [invoicesOpen, setInvoicesOpen] = useState(false);

  const {
    data: financialReportResponse,
    isLoading: financialLoading,
    isFetching: financialFetching,
  } = useGetFinancialReport(scopedReportParams);

  const {
    data: ordersReportResponse,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
  } = useGetOrdersReport(scopedReportParams);

  const financialData = financialReportResponse?.data;
  const ordersData = ordersReportResponse?.data;
  const reportCurrency = getReportCurrency(financialData, ordersData);

  const financialStats = useMemo(() => buildFinancialStats(financialData, reportCurrency), [financialData, reportCurrency]);

  const orderStats = useMemo(() => buildOrderReportStats(ordersData, reportCurrency), [ordersData, reportCurrency]);

  const { title, description } = getReportHeaderContent(activeTab, isBranchAdmin);

  const activeStats = activeTab === "financial" ? financialStats : orderStats;

  const activeReportData =
    activeTab === "financial" ? financialData : ordersData;

  const activeLoading =
    authLoading ||
    (activeTab === "financial"
      ? financialLoading || financialFetching
      : ordersLoading || ordersFetching);

  const handleDownloadActiveReportPdf = () => {
    if (!restaurantId) {
      toast.error("Restaurant is not available");
      return;
    }

    downloadRestaurantDashboardReportPdf({
      reportType: activeTab,
      title,
      description,
      restaurantId,
      currency: reportCurrency,
      stats: activeStats.map((stat) => ({
        title: stat.title,
        value: String(stat.value ?? "-"),
        description: stat.trend?.percentage,
      })),
      data: activeReportData,
    });

    toast.success(`${title} PDF downloaded successfully`);
  };

  return (
    <Container>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Header title={title} description={description} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={activeLoading || !restaurantId}
            onClick={handleDownloadActiveReportPdf}
            className="h-[44px] rounded-[12px] border-gray-200 px-5 text-gray-700"
          >
            <Download size={17} className="mr-2" />
            Download PDF
          </Button>

          <Button
            type="button"
            disabled={!restaurantId}
            onClick={() => setInvoicesOpen(true)}
            className="h-[44px] rounded-[12px] px-5"
          >
            <ReceiptText size={17} className="mr-2" />
            {isBranchAdmin ? "Branch Invoices" : "Restaurant Invoices"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 rounded-lg bg-white p-4 shadow-sm lg:p-6">
        <div className="flex items-center gap-6">
          <TabButton
            active={activeTab === "financial"}
            onClick={() => setActiveTab("financial")}
          >
            Financial Report
          </TabButton>

          <TabButton
            active={activeTab === "order"}
            onClick={() => setActiveTab("order")}
          >
            Orders Report
          </TabButton>
        </div>

        {activeTab === "financial" ? (
          <>
            <StatsSection
              stats={activeStats}
              loading={activeLoading}
              className="xl:grid-cols-4"
            />

            <RevenueAnalytics />
          </>
        ) : (
          <>
            <StatsSection
              stats={activeStats}
              loading={activeLoading}
              className="xl:grid-cols-4"
            />

            <OrdersGraph />
          </>
        )}
      </div>

      <RestaurantInvoicesModal
        open={invoicesOpen}
        onOpenChange={setInvoicesOpen}
        restaurantId={restaurantId}
        branchId={isBranchAdmin ? branchId : undefined}
      />
    </Container>
  );
}