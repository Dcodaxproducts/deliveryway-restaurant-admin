"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StatsSection from "@/components/common/stats-section";
import { OrdersHeader } from "@/components/pages/Orders/components/orders/header";
import Container from "@/components/common/Container";
import {
  OrdersTable,
  type OrdersTableRow,
} from "@/components/pages/Orders/components/orders/table";
import { Button } from "@/components/ui/button";
import { OrdersFilters } from "@/components/pages/Orders/components/orders/OrdersFilters";
import { GeneratedInvoiceHistoryTable } from "@/components/pages/Orders/components/orders/GeneratedInvoiceHistoryTable";
import { useAuth } from "@/hooks/useAuth";
import PaginationSection from "@/components/common/pagination";
import { sortData } from "@/lib/sort-data";
import { useGetOrdersStats } from "@/hooks/useDashboard";
import { useOrders } from "@/hooks/useOrders";
import { useGetGeneratedInvoices } from "@/hooks/useReports";
import {
  buildOrderStats,
  getOrdersHeaderContent,
  type OrderTab,
} from "@/components/pages/orders/utils/orders-page.helpers";
import {
  matchesOrdersScheduleFilter,
  type OrdersScheduleDateRange,
  type OrdersScheduleFilter,
} from "@/components/pages/Orders/utils/orders-schedule-filters";
import { useTranslations } from "next-intl";
import type { Order } from "@/types/orders";

const orderTabs = new Set<OrderTab>([
  "all",
  "delivery",
  "pickup",
  "reservations",
  "group",
  "invoice-history",
]);

const getOrderCustomerName = (order: Order) => {
  const customer = order.customer;
  return (
    customer?.fullName ||
    customer?.name ||
    `${customer?.firstName ?? ""} ${customer?.lastName ?? ""}`.trim()
  );
};

export function OrdersPage() {
  const t = useTranslations("orders");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");
  const [scheduleFilter, setScheduleFilter] =
    useState<OrdersScheduleFilter>("ALL");
  const [scheduleRange, setScheduleRange] = useState<OrdersScheduleDateRange>(
    {},
  );

  const [sortKey, setSortKey] = useState<keyof OrdersTableRow | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { user, branchId, isBranchAdmin } = useAuth();
  const restaurantId = user?.restaurantId;
  const scopedBranchId = isBranchAdmin ? branchId || undefined : undefined;

  const {
    data: orderStatsResponse,
    isLoading: isOrderStatsLoading,
    isFetching: isOrderStatsFetching,
  } = useGetOrdersStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined,
  );

  const orderStats = orderStatsResponse?.data;

  const dynamicStats = buildOrderStats(orderStats, t);

  const orderType =
    activeTab === "delivery"
      ? "DELIVERY"
      : activeTab === "pickup"
        ? "TAKEAWAY"
        : undefined;
  const orderKind = activeTab === "group" ? "group-orders" : "order";
  const isInvoiceHistoryTab = activeTab === "invoice-history";

  const ordersQuery = useOrders({
    restaurantId: restaurantId || undefined,
    branchId: scopedBranchId,
    search: search || undefined,
    status: status !== "ALL" ? status : undefined,
    sortOrder,
    page,
    limit,
    orderType,
    kind: orderKind,
    enabled: !isInvoiceHistoryTab,
  });

  const generatedInvoicesQuery = useGetGeneratedInvoices(
    {
      kind: "ORDER",
      restaurantId: restaurantId || undefined,
      branchId: scopedBranchId,
    },
    { enabled: isInvoiceHistoryTab && Boolean(restaurantId) },
  );

  const orders: Order[] = ordersQuery.orders;
  const paginationMeta = ordersQuery.meta;
  const loading = ordersQuery.loading;
  const totalPages = paginationMeta?.totalPages || 1;
  const total = paginationMeta?.total || 0;
  const hasNext = paginationMeta?.hasNext || false;
  const hasPrevious = paginationMeta?.hasPrevious || false;

  useEffect(() => {
    const tab = searchParams.get("tab") as OrderTab | null;

    if (tab && orderTabs.has(tab)) {
      setActiveTab(tab);
      return;
    }

    setActiveTab("all");
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, sortOrder, status, activeTab, scheduleFilter, scheduleRange]);

  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    router.replace(`/orders?tab=${tab}`, { scroll: false });
  };

  const handleSort = (key: keyof OrdersTableRow) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const ordersWithCustomerName: OrdersTableRow[] = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        customerName: getOrderCustomerName(order),
      })),
    [orders],
  );
  const filteredOrders = useMemo(
    () =>
      ordersWithCustomerName.filter((order) =>
        matchesOrdersScheduleFilter(order, scheduleFilter, scheduleRange),
      ),
    [ordersWithCustomerName, scheduleFilter, scheduleRange],
  );
  const sortedOrders = sortKey
    ? sortData<OrdersTableRow>(filteredOrders, sortKey, sortDir)
    : filteredOrders;
  const isClientScheduleFilterActive = scheduleFilter !== "ALL";

  const { title, description } = getOrdersHeaderContent(
    activeTab,
    isBranchAdmin,
    t,
  );

  return (
    <Container>
      <OrdersHeader
        title={title}
        description={description}
        orders={sortedOrders}
      />

      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <StatsSection
          stats={dynamicStats}
          loading={isOrderStatsLoading || isOrderStatsFetching}
          className="xl:grid-cols-4"
        />

        <div className="flex items-center gap-0 flex-wrap text-sm lg:text-base">
          <TabButton
            active={activeTab === "all"}
            tone="primary"
            onClick={() => handleTabChange("all")}
          >
            {t("allOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "delivery"}
            tone="accent"
            onClick={() => handleTabChange("delivery")}
          >
            {t("deliveryOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "pickup"}
            tone="primary"
            onClick={() => handleTabChange("pickup")}
          >
            {t("pickupOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "group"}
            tone="primary"
            onClick={() => handleTabChange("group")}
          >
            {t("groupOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "invoice-history"}
            tone="primary"
            onClick={() => handleTabChange("invoice-history")}
          >
            {t("invoiceHistory")}
          </TabButton>
        </div>

        {isInvoiceHistoryTab ? (
          <GeneratedInvoiceHistoryTable
            invoices={generatedInvoicesQuery.data?.data || []}
            loading={
              generatedInvoicesQuery.isLoading ||
              generatedInvoicesQuery.isFetching
            }
          />
        ) : (
          <>
            <OrdersFilters
              onSearch={setSearch}
              onSortChange={setSortOrder}
              onStatusChange={setStatus}
              scheduleFilter={scheduleFilter}
              scheduleRange={scheduleRange}
              onScheduleFilterChange={setScheduleFilter}
              onScheduleRangeChange={setScheduleRange}
            />

            {isClientScheduleFilterActive ? (
              <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {t("scheduleClientFilterNotice", {
                  shown: sortedOrders.length,
                  loaded: ordersWithCustomerName.length,
                })}
              </div>
            ) : null}

            <OrdersTable
              orders={sortedOrders}
              loading={loading}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              activeTab={activeTab}
            />

            <PaginationSection
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={(newPage: number) => setPage(newPage)}
            />
          </>
        )}
      </div>
    </Container>
  );
}

function TabButton({
  active,
  tone,
  children,
  onClick,
}: {
  active: boolean;
  tone: "primary" | "accent";
  children: React.ReactNode;
  onClick: () => void;
}) {
  const activeClass =
    tone === "accent"
      ? "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90 focus-visible:ring-[var(--brand-accent)]/30"
      : "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/30";

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      aria-pressed={active}
      className={`rounded-[14px] px-3 py-2.5 text-sm font-semibold transition-colors sm:px-6 ${
        active
          ? activeClass
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-gray-200"
      }`}
    >
      {children}
    </Button>
  );
}
