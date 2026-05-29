"use client";

import { useState } from "react";
import BranchFilters from "./BranchFilters";
import Table from "./list";

interface Props {
  branches: any[];
  meta: any;
  loading: boolean;
  fetchBranches: (params?: any) => void;
}

export default function BranchesClient({
  branches,
  meta,
  loading,
  fetchBranches,
}: Props) {
  const [filters, setFilters] = useState({
    search: "",
    sortOrder: "ASC",
    includeInactive: false,
    withDeleted: false,
    page: 1,
  });

  const handleFilterChange = (newFilters: any) => {
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