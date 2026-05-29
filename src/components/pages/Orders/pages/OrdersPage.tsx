"use client";

import { useEffect, useState } from "react";
import StatsSection from "@/components/common/stats-section";
import Header from "@/components/pages/Orders/components/orders/header";
import Container from "@/components/common/Container";
import Table from "@/components/pages/Orders/components/orders/table";
import { Button } from "@/components/ui/button";
import OrdersFilters from "@/components/pages/Orders/components/orders/OrdersFilters";
import { useAuth } from "@/hooks/useAuth";
import PaginationSection from "@/components/common/pagination";
import { sortData } from "@/lib/sort-data";
import { useGetOrdersStats } from "@/hooks/useDashboard";
import useOrders from "@/hooks/useOrders";
import { useGetAdminTableReservations } from "@/hooks/useReservations";
import {
  buildOrderStats,
  getOrdersHeaderContent,
  mapReservationToOrder,
  type Order,
  type OrderTab,
} from "@/components/pages/Orders/utils/orders-page.helpers";

export default function Orders() {
  const [activeTab, setActiveTab] = useState<OrderTab>("delivery");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [status, setStatus] = useState("ALL");

  const [sortKey, setSortKey] = useState<any>(null);
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
    refetch: refetchOrderStats,
  } = useGetOrdersStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined
  );

  const orderStats = orderStatsResponse?.data;

  const dynamicStats = buildOrderStats(orderStats);

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
    enabled: activeTab !== "reservations",
  });

  const reservationsQuery = useGetAdminTableReservations(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
          page,
          limit,
        }
      : undefined
  );

  const reservationOrders: Order[] = (reservationsQuery.data?.data || []).map(mapReservationToOrder);
  const orders: Order[] = activeTab === "reservations" ? reservationOrders : ordersQuery.orders;
  const paginationMeta = activeTab === "reservations" ? reservationsQuery.data?.meta : ordersQuery.meta;
  const loading = activeTab === "reservations" ? reservationsQuery.isLoading : ordersQuery.loading;
  const totalPages = paginationMeta?.totalPages || 1;
  const total = paginationMeta?.total || 0;
  const hasNext = paginationMeta?.hasNext || false;
  const hasPrevious = paginationMeta?.hasPrevious || false;

  useEffect(() => {
    setPage(1);
  }, [search, sortOrder, status, activeTab]);

  const handleSort = (key: any) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedOrders = sortKey ? sortData(orders, sortKey as keyof Order, sortDir) : orders;

  const { title, description } = getOrdersHeaderContent(activeTab, isBranchAdmin);

  const handleRefresh = () => {
    refetchOrderStats();
    if (activeTab === "reservations") {
      reservationsQuery.refetch();
    } else {
      ordersQuery.refetch();
    }
  };

  return (
    <Container>
      <Header title={title} description={description} orders={sortedOrders} />

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
            Delivery Orders
          </TabButton>

          <TabButton
            active={activeTab === "pickup"}
            onClick={() => setActiveTab("pickup")}
          >
            Pick up Orders
          </TabButton>

          <TabButton
            active={activeTab === "reservations"}
            onClick={() => setActiveTab("reservations")}
          >
            Reservations
          </TabButton>

          <TabButton
            active={activeTab === "group"}
            onClick={() => setActiveTab("group")}
          >
            Group Orders
          </TabButton>
        </div>

        <OrdersFilters
          onSearch={setSearch}
          onSortChange={setSortOrder}
          onStatusChange={setStatus}
        />

        <Table
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

function TabButton({ active, children, onClick }: any) {
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