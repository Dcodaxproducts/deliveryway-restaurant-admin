"use client";

import { useMemo, useState } from "react";
import Container from "@/components/container";
import StatsSection from "@/components/customer-settings/stats-section";
import Table from "@/components/customer-settings/table";
import Header from "@/components/customer-settings/header";
import BranchFilters from "@/components/branches/BranchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useGetCustomersList } from "@/hooks/useCustomers";
import { useGetCustomersStats } from "@/hooks/useDashboard";

interface Customer {
  id: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  _count?: {
    customerOrders?: number;
  };
}

export default function CustomerSettingsPage() {
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    sortOrder: "DESC" as "ASC" | "DESC",
    withDeleted: false,
    includeInactive: true,
  });

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetCustomersList(
    restaurantId
      ? {
          page: filters.page,
          search: filters.search || undefined,
          sortOrder: filters.sortOrder,
          withDeleted: filters.withDeleted,
          includeInactive: filters.includeInactive,
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined
  );

  const {
    data: customerStatsResponse,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    refetch: refetchCustomerStats,
  } = useGetCustomersStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined
  );

  const customerStats = customerStatsResponse?.data;

  const customers: Customer[] = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const meta = data?.meta || null;

  const handleFilterChange = (updatedFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      page:
        updatedFilters.page ??
        (updatedFilters.search !== undefined ? 1 : prev.page),
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const customerFilterData = useMemo(() => {
    return customers.map((customer) => ({
      id: customer.id,
      name:
        `${customer.profile?.firstName || ""} ${customer.profile?.lastName || ""}`.trim() ||
        "-",
      email: customer.email || "-",
      phone: customer.profile?.phone || "-",
      isActive: !!customer.isActive,
      createdAt: customer.createdAt || "",
      orders: customer._count?.customerOrders ?? 0,
    }));
  }, [customers]);

  const handleRefresh = () => {
    refetch();
    refetchCustomerStats();
  };

  return (
    <Container>
      <Header
        title={isBranchAdmin ? "Branch Customers" : "Customer List"}
        description={
          isBranchAdmin
            ? "View customers connected to your assigned branch"
            : "View and manage all customers from here"
        }
        onRefresh={handleRefresh}
      />

      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
        <StatsSection
          stats={customerStats}
          loading={isStatsLoading || isStatsFetching}
        />

        {!isBranchAdmin ? (
          <BranchFilters
            branches={customerFilterData}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ) : null}

        <Table
          customers={customers}
          loading={isLoading || isFetching}
          meta={meta}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
      </div>
    </Container>
  );
}