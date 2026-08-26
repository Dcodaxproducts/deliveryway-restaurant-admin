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
import { useAuth } from "@/hooks/useAuth";
import PaginationSection from "@/components/common/pagination";
import { sortData } from "@/lib/sort-data";
import { useOrders } from "@/hooks/useOrders";
import { useGetOrdersReport } from "@/hooks/useReports";
import { useCurrency } from "@/hooks/useCurrency";
import {
  buildOrderStats,
  canRequestOrdersReport,
  getOrdersHeaderContent,
  type OrderTab,
} from "@/components/pages/orders/utils/orders-page.helpers";
import {
  buildOrdersScheduleQuery,
  type OrdersScheduleDateRange,
  type OrdersScheduleFilter,
} from "@/components/pages/Orders/utils/orders-schedule-filters";
import { useTranslations } from "next-intl";
import type { Order } from "@/types/orders";
import { isStaffRole } from "@/lib/auth";

const orderTabs = new Set<OrderTab>([
  "today",
  "all",
  "payment-pending",
  "delivery",
  "pickup",
  "reservations",
  "group",
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
  const [activeTab, setActiveTab] = useState<OrderTab>("today");
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
  const { user, restaurantId, branchId, isBranchAdmin, scopedParams } =
    useAuth();
  const scopedRestaurantId = scopedParams.restaurantId || restaurantId;
  const scopedBranchId =
    scopedParams.branchId ||
    (isBranchAdmin ? branchId || undefined : undefined);
  const { currency } = useCurrency(scopedRestaurantId);

  const orderType =
    activeTab === "delivery"
      ? "DELIVERY"
      : activeTab === "pickup"
        ? "TAKEAWAY"
        : undefined;
  const orderKind = activeTab === "group" ? "group-orders" : "order";
  const effectiveStatus =
    activeTab === "payment-pending"
      ? "PAYMENT_PENDING"
      : status !== "ALL"
        ? status
        : undefined;
  const excludeStatus =
    activeTab === "today" || activeTab === "all"
      ? "PAYMENT_PENDING"
      : undefined;
  const successfulOnly = activeTab === "today" || activeTab === "all";
  const todayRange = useMemo(() => {
    if (activeTab !== "today") return {};

    const from = new Date();
    const to = new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { fromDate: from.toISOString(), toDate: to.toISOString() };
  }, [activeTab]);
  const scheduleQuery = useMemo(
    () => buildOrdersScheduleQuery(scheduleFilter, scheduleRange),
    [scheduleFilter, scheduleRange],
  );
  const reportDateRange = useMemo(() => {
    return { ...todayRange, ...scheduleQuery };
  }, [scheduleQuery, todayRange]);
  const canRequestOrderReport = canRequestOrdersReport({
    isStaff: isStaffRole(user?.role, user?.actorType),
    restaurantId: scopedRestaurantId,
  });
  const orderReportQuery = useGetOrdersReport(
    {
      restaurantId: scopedRestaurantId,
      branchId: scopedBranchId,
      orderType,
      kind: orderKind,
      status: effectiveStatus,
      excludeStatus,
      ...reportDateRange,
    },
    { enabled: canRequestOrderReport },
  );
  const orderStats = orderReportQuery.data?.data;
  const dynamicStats = buildOrderStats(orderStats, t, currency);

  const ordersQuery = useOrders({
    restaurantId: scopedRestaurantId || undefined,
    branchId: scopedBranchId,
    search: search || undefined,
    status: effectiveStatus,
    sortOrder,
    page,
    limit,
    orderType,
    kind: orderKind,
    excludeStatus,
    successfulOnly,
    createdFrom: todayRange.fromDate,
    createdTo: todayRange.toDate,
    ...scheduleQuery,
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
    const tab = searchParams.get("tab") as OrderTab | null;

    if (tab && orderTabs.has(tab)) {
      setActiveTab(tab);
      return;
    }

    setActiveTab("today");
    router.replace("/orders?tab=today", { scroll: false });
  }, [router, searchParams]);

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
  const sortedOrders = sortKey
    ? sortData<OrdersTableRow>(ordersWithCustomerName, sortKey, sortDir)
    : ordersWithCustomerName;

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
          loading={orderReportQuery.isLoading || orderReportQuery.isFetching}
          className="xl:grid-cols-3 2xl:grid-cols-6"
        />

        <div className="flex items-center gap-0 flex-wrap text-sm lg:text-base">
          <TabButton
            active={activeTab === "today"}
            tone="primary"
            onClick={() => handleTabChange("today")}
          >
            {t("todayOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "all"}
            tone="primary"
            onClick={() => handleTabChange("all")}
          >
            {t("allOrders")}
          </TabButton>

          <TabButton
            active={activeTab === "payment-pending"}
            tone="accent"
            onClick={() => handleTabChange("payment-pending")}
          >
            {t("paymentPendingOrders")}
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
        </div>

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
