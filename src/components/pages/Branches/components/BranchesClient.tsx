"use client";

import { useState } from "react";
import PaginationSection, { type PaginationMeta } from "@/components/common/PaginationSection";
import BranchFilters, { type BranchFilterState } from "./BranchFilters";
import Table, { type BranchListItem } from "./list";

interface Props {
  branches: BranchListItem[];
  meta: PaginationMeta | null;
  loading: boolean;
  error?: string | null;
  fetchBranches: (params?: BranchFilterState) => void;
}

export default function BranchesClient({
  branches,
  meta,
  loading,
  error,
  fetchBranches,
}: Props) {
  const [filters, setFilters] = useState<BranchFilterState>({
    search: "",
    sortOrder: "ASC",
    includeInactive: false,
    withDeleted: false,
    page: 1,
  });

  const handleFilterChange = (newFilters: BranchFilterState) => {
    const updated = { ...filters, ...newFilters };

    setFilters(updated);

    fetchBranches(updated);
  };

  return (
    <>
      <BranchFilters
        branches={branches}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="px-2 lg:px-0">
        <Table branches={branches} loading={loading} error={error} />
        <PaginationSection meta={meta} onPageChange={(page) => handleFilterChange({ ...filters, page })} />
      </div>
    </>
  );
}
