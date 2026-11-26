"use client";

import { useMemo, useState } from "react";
import Container from "@/components/common/Container";
import StatsSection from "@/components/pages/Customers/components/customer-settings/stats-section";
import Table from "@/components/pages/Customers/components/customer-settings/table";
import Header from "@/components/pages/Customers/components/customer-settings/header";
import BranchFilters from "@/components/pages/Branches/components/BranchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useGetCustomersList } from "@/hooks/useCustomers";
import { useTranslations } from "next-intl";
import { mergeCustomerListFilters } from "@/lib/customer-list-query";

interface Customer {
  id: string;
  email?: string;
  isGuest?: boolean;
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
    isGuest: undefined as boolean | undefined,
    isVerified: undefined as boolean | undefined,
    isActive: undefined as boolean | undefined,
    fromDate: "",
    toDate: "",
  });

  const { data, isLoading, isFetching, refetch } = useGetCustomersList(
    restaurantId
      ? {
          page: filters.page,
          search: filters.search || undefined,
          sortOrder: filters.sortOrder,
          withDeleted: filters.withDeleted,
          includeInactive: filters.includeInactive,
          isGuest: filters.isGuest,
          isVerified: filters.isVerified,
          isActive: filters.isActive,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined,
  );

  const customerStats = data?.stats;

  const customers: Customer[] = useMemo(() => {
    return data?.data ?? [];
  }, [data]);

  const meta = data?.meta ?? null;

  const handleFilterChange = (updatedFilters: Partial<typeof filters>) => {
    setFilters((prev) => mergeCustomerListFilters(prev, updatedFilters));
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
          loading={isLoading || isFetching}
        />

        {!isBranchAdmin ? (
          <BranchFilters
            branches={customerFilterData}
            filters={filters}
            onFilterChange={handleFilterChange}
            showCustomerFilters
            totalResults={meta?.total}
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
