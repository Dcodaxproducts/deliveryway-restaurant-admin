"use client";

import { useEffect, useMemo, useState } from "react";
import StatsSection from "@/components/common/stats-section";
import { OrdersHeader } from "@/components/pages/Orders/components/orders/header";
import Container from "@/components/common/Container";
import {
  OrdersTable,
  type OrdersTableRow,
} from "@/components/pages/Orders/components/orders/table";
import { Button } from "@/components/ui/button";
import { OrdersFilters } from "@/components/pages/Orders/components/orders/OrdersFilters";
import { useAuth } from "@/hooks/useAuth";
import PaginationSection from "@/components/common/pagination";
import { sortData } from "@/lib/sort-data";
import { useGetOrdersStats } from "@/hooks/useDashboard";
import { useOrders } from "@/hooks/useOrders";
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
  const [activeTab, setActiveTab] = useState<OrderTab>("delivery");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");
  const [scheduleFilter, setScheduleFilter] =
    useState<OrdersScheduleFilter>("ALL");
  const [scheduleRange, setScheduleRange] =
    useState<OrdersScheduleDateRange>({});

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
      : undefined
  );

  const orderStats = orderStatsResponse?.data;

  const dynamicStats = buildOrderStats(orderStats, t);

  const orderType = activeTab === "delivery" ? "DELIVERY" : activeTab === "pickup" ? "TAKEAWAY" : undefined;
  const orderKind = activeTab === "group" ? "group-orders" : "order";

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
    enabled: true,
  });

  const orders: Order[] = ordersQuery.orders;
  const paginationMeta = ordersQuery.meta;
  const loading = ordersQuery.loading;
  const totalPages = paginationMeta?.totalPages || 1;
  const total = paginationMeta?.total || 0;
  const hasNext = paginationMeta?.hasNext || false;
  const hasPrevious = paginationMeta?.hasPrevious || false;

  useEffect(() => {
    setPage(1);
  }, [search, sortOrder, status, activeTab, scheduleFilter, scheduleRange]);

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
    [orders]
  );
  const filteredOrders = useMemo(
    () =>
      ordersWithCustomerName.filter((order) =>
        matchesOrdersScheduleFilter(order, scheduleFilter, scheduleRange)
      ),
    [ordersWithCustomerName, scheduleFilter, scheduleRange]
  );
  const sortedOrders = sortKey
    ? sortData<OrdersTableRow>(filteredOrders, sortKey, sortDir)
    : filteredOrders;
  const isClientScheduleFilterActive = scheduleFilter !== "ALL";

  const { title, description } = getOrdersHeaderContent(activeTab, isBranchAdmin, t);

  return (
    <Container>
      <OrdersHeader title={title} description={description} orders={sortedOrders} />

      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <StatsSection
          stats={dynamicStats}
          loading={isOrderStatsLoading || isOrderStatsFetching}
          className="xl:grid-cols-4"
        />

        <div className="flex items-center gap-0 flex-wrap text-sm lg:text-base">
          <TabButton
            active={activeTab === "delivery"}
            onClick={() => setActiveTab("delivery")}
          >
            {t("deliveryOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "pickup"}
            onClick={() => setActiveTab("pickup")}
          >
            {t("pickupOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "group"}
            onClick={() => setActiveTab("group")}
          >
            {t("groupOrders")}
          </TabButton>
        </div>

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
      </div>
    </Container>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "default" : "ghost"}
      className={
        active
          ? "rounded-[14px] px-3 sm:px-6 py-2.5 bg-primary text-white"
          : "rounded-full px-3 sm:px-6 py-2 text-gray-500 hover:text-black"
      }
    >
      {children}
    </Button>
  );
}
