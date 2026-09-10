"use client";

import { useState } from "react";
import BranchFilters, { type BranchFilterState } from "./BranchFilters";
import Table from "./list";

type BranchListItem = {
  id: string;
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  _count?: { items?: number };
};

interface Props {
  branches: BranchListItem[];
  meta: unknown;
  loading: boolean;
  fetchBranches: (params?: BranchFilterState) => void;
}

export default function BranchesClient({
  branches,
  meta,
  loading,
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
        <Table branches={branches} loading={loading} />

      
      </div>
    </>
  );
}
