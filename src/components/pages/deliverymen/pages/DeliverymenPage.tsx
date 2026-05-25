"use client";

import { useState } from "react";
import Container from "@/components/container";
import StatsSection from "@/components/deliveryman/stats-section";
import Table from "@/components/deliveryman/table";
import Header from "@/components/deliveryman/header";
import BranchFilters from "@/components/branches/BranchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useDeliverymen } from "@/hooks/useDeliverymen";
import { useGetDeliverymenStats } from "@/hooks/useDashboard";

const Deliveryman = () => {
  const { restaurantId, branchId, isBranchAdmin, loading } = useAuth();
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useDeliverymen({
    search: filters.search,
    page: filters.page,
    limit: filters.limit,
    branchId: scopedBranchId,
    status: undefined,
    restaurantId: restaurantId ?? undefined,
  });

  const {
    data: deliverymanStatsResponse,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchDeliverymanStats,
  } = useGetDeliverymenStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined
  );

  const deliverymanStats = deliverymanStatsResponse?.data;

  const deliverymen = data?.data || [];
  const meta = data?.meta || null;

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handleRefresh = () => {
    refetch();
    refetchDeliverymanStats();
  };

  const isTableLoading = isLoading || isFetching || loading;
  const isCardLoading = isStatsLoading || isStatsFetching || loading;

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch Delivery Team" : "Delivery Man List"}
        description={
          isBranchAdmin
            ? "View and manage delivery staff for your assigned branch"
            : "View and manage all Delivery Man from here"
        }
      />

      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <StatsSection
          stats={deliverymanStats}
          loading={isCardLoading}
        />

        {!isBranchAdmin ? (
          <BranchFilters
            branches={deliverymen}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ) : null}

        <Table
          data={deliverymen}
          meta={meta}
          loading={isTableLoading}
          onPageChange={(page: number) =>
            setFilters((prev) => ({ ...prev, page }))
          }
          refresh={handleRefresh}
        />
      </div>
    </Container>
  );
};

export default Deliveryman;