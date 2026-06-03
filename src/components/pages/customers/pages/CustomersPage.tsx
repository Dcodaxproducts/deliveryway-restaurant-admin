"use client";

import { useMemo, useState } from "react";
import Container from "@/components/common/Container";
import StatsSection from "@/components/pages/Customers/components/customer-settings/stats-section";
import Table from "@/components/pages/Customers/components/customer-settings/table";
import Header from "@/components/pages/Customers/components/customer-settings/header";
import BranchFilters from "@/components/pages/Branches/components/BranchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useGetCustomersList } from "@/hooks/useCustomers";
import { useGetCustomersStats } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("customers");
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    sortOrder: "DESC" as "ASC" | "DESC",
    withDeleted: false,
    includeInactive: true,
  });

  const { data, isLoading, isFetching, refetch } = useGetCustomersList(
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
      : undefined,
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
      : undefined,
  );

  const customerStats = customerStatsResponse?.data;

  const customers: Customer[] = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const meta = data?.meta ?? null;

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
    return customers.map(
      ({ id, email, isActive, createdAt, profile, _count }) => ({
        id,
        name:
          `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
          "-",
        email: email?.trim() || "-",
        phone: profile?.phone?.trim() || "-",
        isActive: Boolean(isActive),
        createdAt: createdAt ?? "",
        orders: _count?.customerOrders ?? 0,
      }),
    );
  }, [customers]);

  const handleRefresh = () => {
    refetch();
    refetchCustomerStats();
  };

  return (
    <Container>
      <Header
        title={isBranchAdmin ? t("branchTitle") : t("listTitle")}
        description={isBranchAdmin ? t("branchDescription") : t("description")}
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
