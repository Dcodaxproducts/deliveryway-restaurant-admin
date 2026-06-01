"use client";

import { useState } from "react";
import Container from "@/components/common/Container";
import Header from "@/components/pages/Branches/components/header";
import BranchesClient from "@/components/pages/Branches/components/BranchesClient";
import { useGetBranches } from "@/hooks/useBranches";
import { useAuth } from "@/hooks/useAuth";
import BranchWorkspace from "@/components/pages/BranchWorkspace/components/branch-admin/BranchWorkspace";

export default function BranchesPage() {
  const { isBranchAdmin } = useAuth();

  if (isBranchAdmin) {
    return <BranchWorkspace />;
  }

  return <RestaurantBranchesPage />;
}

function RestaurantBranchesPage() {
  const [filters, setFilters] = useState({
    search: "",
    sortOrder: "ASC" as "ASC" | "DESC",
    includeInactive: false,
    withDeleted: false,
    page: 1,
  });

  const { user } = useAuth();
  const restaurantId = user?.restaurantId ?? undefined;

  const { data, isLoading, refetch } = useGetBranches({
    ...filters,
    restaurantId,
  });

  const branches = data?.data || [];
  const meta = data?.meta || null;

  const handleFetchBranches = (newFilters?: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  return (
    <Container>
      <Header
        title="Branch List"
        description="View and manage all branches from here"
        onBranchCreated={refetch}
      />

      <div className="space-y-[32px] bg-white lg:p-[30px] rounded-[14px] shadow-sm">
        <BranchesClient
          branches={branches}
          meta={meta}
          loading={isLoading}
          fetchBranches={handleFetchBranches}
        />
      </div>
    </Container>
  );
}
