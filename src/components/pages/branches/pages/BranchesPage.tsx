"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import Header from "@/components/pages/Branches/components/header";
import BranchesClient from "@/components/pages/Branches/components/BranchesClient";
import { useGetBranches } from "@/hooks/useBranches";
import { useAuth } from "@/hooks/useAuth";
import BranchWorkspace from "@/components/pages/BranchWorkspace/components/branch-admin/BranchWorkspace";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export function BranchesPage() {
  const { isBranchAdmin } = useAuth();

  if (isBranchAdmin) {
    return <BranchWorkspace />;
  }

  return <RestaurantBranchesPage />;
}

export { BranchesPage as default };

function RestaurantBranchesPage() {
  const feedbackT = useTranslations("common.feedback");
  const t = useTranslations("branches");
  const [filters, setFilters] = useState({
    search: "",
    sortOrder: "ASC" as "ASC" | "DESC",
    includeInactive: false,
    withDeleted: false,
    page: 1,
  });

  const { user, loading: authLoading } = useAuth();
  const restaurantId = user?.restaurantId ?? undefined;

  const { data, isLoading, isFetching, isError, refetch } = useGetBranches({
    ...filters,
    restaurantId,
  });

  const branches = data?.data || [];
  const meta = data?.meta || null;
  const hasExistingBranches = Number(meta?.total ?? branches.length) > 0;

  const handleFetchBranches = (newFilters?: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  return (
    <Container>
      <Header
        hasExistingBranches={hasExistingBranches}
        title={t("branchList")}
        description={t("description")}
        onBranchCreated={refetch}
      />

      <SectionCard padding="md">
        {isError && data ? (
          <StatePanel state="error" title={feedbackT("refreshFailed", { subject: feedbackT("subjects.branches") })} description={feedbackT("cachedDescription")} compact />
        ) : null}
        <BranchesClient
          branches={branches}
          meta={meta}
          loading={!data && (authLoading || isLoading || isFetching)}
          error={isError && !data ? feedbackT("loadFailedDescription") : null}
          fetchBranches={handleFetchBranches}
        />
        {isError ? <Button type="button" variant="outline" disabled={isFetching || authLoading} onClick={() => void refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.branches") })}</Button> : null}
      </SectionCard>
    </Container>
  );
}
