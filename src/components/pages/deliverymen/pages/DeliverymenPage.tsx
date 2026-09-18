"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import StatsSection from "@/components/pages/Deliverymen/components/deliveryman/stats-section";
import Table from "@/components/pages/Deliverymen/components/deliveryman/table";
import Header from "@/components/pages/Deliverymen/components/deliveryman/header";
import BranchFilters, { type BranchFilterState } from "@/components/pages/Branches/components/BranchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useDeliverymen } from "@/hooks/useDeliverymen";
import { useGetDeliverymenStats } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

const Deliveryman = () => {
  const feedbackT = useTranslations("common.feedback");
  const commonT = useTranslations("common");
  const { restaurantId, branchId, isBranchAdmin, loading } = useAuth();
  const t = useTranslations("deliverymen");
  const scopedBranchId = isBranchAdmin ? branchId : undefined;

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isFetching, isError, refetch } = useDeliverymen({
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
    isError: isStatsError,
    refetch: refetchDeliverymanStats,
  } = useGetDeliverymenStats(
    restaurantId
      ? {
          restaurantId,
          ...(scopedBranchId ? { branchId: scopedBranchId } : {}),
        }
      : undefined,
  );

  const deliverymanStats = deliverymanStatsResponse?.data;

  const deliverymen = data?.data || [];
  const meta = data?.meta || null;

  const handleFilterChange = (newFilters: BranchFilterState) => {
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

  const isTableLoading = !data && (isLoading || isFetching || loading);
  const isCardLoading = isStatsLoading || isStatsFetching || loading;

  return (
    <Container>
      <Header
        title={isBranchAdmin ? t("branchTitle") : t("listTitle")}
        description={isBranchAdmin ? t("branchDescription") : t("description")}
      />

      <SectionCard padding="md" className="space-y-6">
        {isStatsError ? (
          <StatePanel state="error" title={feedbackT("loadFailed", { subject: feedbackT("subjects.deliverymanMetrics") })}
            description={feedbackT(deliverymanStats ? "cachedDescription" : "loadFailedDescription")}
            action={<Button type="button" variant="outline" disabled={isStatsFetching || loading} onClick={() => void refetchDeliverymanStats()}>{feedbackT("retry", { subject: feedbackT("subjects.deliverymanMetrics") })}</Button>} compact />
        ) : null}
        {deliverymanStats ? <StatsSection stats={deliverymanStats} /> : !isStatsError ? (
          <StatePanel state={isCardLoading ? "loading" : "unavailable"}
            title={feedbackT(isCardLoading ? "loading" : "unavailable", { subject: feedbackT("subjects.deliverymanMetrics") })}
            description={feedbackT("unavailableDescription")} compact />
        ) : null}

        {!loading && !restaurantId ? (
          <StatePanel
            state="unavailable"
            title={commonT("selectRestaurantRequired")}
            description={commonT("selectRestaurantToContinue")}
            compact
          />
        ) : (
          <>
            {!isBranchAdmin ? (
              <BranchFilters
                branches={deliverymen}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            ) : null}

            {isError && data ? (
              <StatePanel state="error" title={feedbackT("refreshFailed", { subject: feedbackT("subjects.deliverymen") })} description={feedbackT("cachedDescription")} compact />
            ) : null}
            <Table
              data={deliverymen}
              meta={meta}
              loading={isTableLoading}
              error={isError && !data ? feedbackT("loadFailedDescription") : null}
              onPageChange={(page: number) =>
                setFilters((prev) => ({ ...prev, page }))
              }
              refresh={handleRefresh}
            />
            {isError ? <Button type="button" variant="outline" disabled={isFetching || loading} onClick={() => void refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.deliverymen") })}</Button> : null}
          </>
        )}
      </SectionCard>
    </Container>
  );
};

export default Deliveryman;
