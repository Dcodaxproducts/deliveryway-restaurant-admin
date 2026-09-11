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
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

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
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const t = useTranslations("customers");
  const feedbackT = useTranslations("common.feedback");
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [filters, setFilters] = useState({
    page: 1,
    search: "",
    sortOrder: "DESC" as "ASC" | "DESC",
    withDeleted: false,
    includeInactive: true,
    isGuest: undefined as boolean | undefined,
  });

  const { data, isLoading, isFetching, isError, refetch } = useGetCustomersList(
    restaurantId
      ? {
          page: filters.page,
          search: filters.search || undefined,
          sortOrder: filters.sortOrder,
          withDeleted: filters.withDeleted,
          includeInactive: filters.includeInactive,
          isGuest: filters.isGuest,
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined,
  );

  const {
    data: customerStatsResponse,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    isError: isStatsError,
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

      <SectionCard padding="md" className="space-y-6">
        {isStatsError ? (
          <StatePanel state="error" title={feedbackT("loadFailed", { subject: feedbackT("subjects.customerMetrics") })}
            description={feedbackT(customerStats ? "cachedDescription" : "loadFailedDescription")}
            action={<Button type="button" variant="outline" disabled={isStatsFetching || authLoading} onClick={() => void refetchCustomerStats()}>{feedbackT("retry", { subject: feedbackT("subjects.customerMetrics") })}</Button>} compact />
        ) : null}
        {customerStats ? <StatsSection stats={customerStats} /> : !isStatsError ? (
          <StatePanel state={authLoading || isStatsLoading || isStatsFetching ? "loading" : "unavailable"}
            title={feedbackT(authLoading || isStatsLoading || isStatsFetching ? "loading" : "unavailable", { subject: feedbackT("subjects.customerMetrics") })}
            description={feedbackT("unavailableDescription")} compact />
        ) : null}

        {!isBranchAdmin ? (
          <BranchFilters
            branches={customerFilterData}
            filters={filters}
            onFilterChange={handleFilterChange}
            showCustomerType
          />
        ) : null}

        {isError && data ? (
          <StatePanel state="error" title={feedbackT("refreshFailed", { subject: feedbackT("subjects.customers") })} description={feedbackT("cachedDescription")} compact />
        ) : null}
        <Table
          customers={customers}
          loading={!data && (authLoading || isLoading || isFetching)}
          error={isError && !data ? feedbackT("loadFailedDescription") : null}
          meta={meta}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
        {isError ? <Button type="button" variant="outline" disabled={isFetching || authLoading} onClick={() => void refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.customers") })}</Button> : null}
      </SectionCard>
    </Container>
  );
}
