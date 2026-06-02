"use client";

import { Filter, Loader2, RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export type TableReservationsFilterState = {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  branchId: string;
};

export type TableReservationBranchOption = {
  id: string;
  name: string;
};

type TableReservationsFiltersProps = {
  filters: TableReservationsFilterState;
  branchOptions: TableReservationBranchOption[];
  isBranchAdmin: boolean;
  branchName?: string;
  visibleCount: number;
  totalCount: number;
  isFetching: boolean;
  onFiltersChange: (filters: Partial<TableReservationsFilterState>) => void;
};

const statusOptions = [
  { label: "All", value: "ALL", helper: "All reservation statuses" },
  { label: "Requested", value: "REQUESTED", helper: "Pending customer requests" },
  { label: "Confirmed", value: "CONFIRMED", helper: "Confirmed reservations" },
  { label: "Cancelled", value: "CANCELLED", helper: "Cancelled reservations" },
  { label: "Completed", value: "COMPLETED", helper: "Completed reservations" },
  { label: "No Show", value: "NO_SHOW", helper: "Customers marked as no show" },
  { label: "Seated", value: "SEATED", helper: "Currently seated customers" },
];

const sortByOptions = [
  { label: "Reservation date", value: "reservationDate" },
  { label: "Created at", value: "createdAt" },
  { label: "Guest count", value: "guestCount" },
  { label: "Status", value: "status" },
];

export default function TableReservationsFilters({
  filters,
  branchOptions,
  isBranchAdmin,
  branchName,
  visibleCount,
  totalCount,
  isFetching,
  onFiltersChange,
}: TableReservationsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const activeStatusOption = useMemo(() => {
    return (
      statusOptions.find((option) => option.value === filters.status) ||
      statusOptions[0]
    );
  }, [filters.status]);

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
      filters.search ||
      filters.status !== "ALL" ||
      filters.sortBy !== "reservationDate" ||
      filters.sortOrder !== "DESC" ||
      filters.branchId
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ search: searchValue.trim() });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [onFiltersChange, searchValue]);

  const handleManualSearch = () => {
    onFiltersChange({ search: searchValue.trim() });
  };

  const handleResetFilters = () => {
    setSearchValue("");
    onFiltersChange({
      search: "",
      status: "ALL",
      sortBy: "reservationDate",
      sortOrder: "DESC",
      branchId: "",
    });
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <Filter size={18} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Reservation Filters
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Search by name, email, or identifier. Current view:{" "}
              <span className="font-medium text-gray-700">
                {activeStatusOption.helper}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
            Showing {visibleCount}
            {totalCount > 0 ? ` of ${totalCount}` : ""}
          </span>

          {isFetching ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Loader2 size={12} className="animate-spin" />
              Refreshing
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
        <div className="min-w-0 xl:col-span-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Search
          </label>

          <div className="relative min-w-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              placeholder="Search by name, email, or identifier..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleManualSearch();
                }
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Status
          </label>

          <select
            value={filters.status || "ALL"}
            onChange={(event) => onFiltersChange({ status: event.target.value })}
            className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Sort By
          </label>

          <select
            value={filters.sortBy}
            onChange={(event) => onFiltersChange({ sortBy: event.target.value })}
            className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            {sortByOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 xl:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Order
          </label>

          <select
            value={filters.sortOrder}
            onChange={(event) =>
              onFiltersChange({
                sortOrder: event.target.value === "ASC" ? "ASC" : "DESC",
              })
            }
            className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="DESC">DESC</option>
            <option value="ASC">ASC</option>
          </select>
        </div>

        <div className="min-w-0 xl:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Branch
          </label>

          {isBranchAdmin ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-[44px] w-full justify-start rounded-[14px] border-gray-200 bg-[#FAFAFA] px-3 text-gray-500"
            >
              <span className="truncate">{branchName || "Current branch"}</span>
            </Button>
          ) : (
            <select
              value={filters.branchId || "ALL"}
              onChange={(event) => {
                const value = event.target.value;
                onFiltersChange({ branchId: value === "ALL" ? "" : value });
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">All branches</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Button
          type="button"
          onClick={handleManualSearch}
          className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90 md:w-full xl:col-span-1"
        >
          Search
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={!hasActiveFilters && !isFetching}
          onClick={handleResetFilters}
          className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700 md:w-full xl:col-span-1"
        >
          <RefreshCcw size={15} className="mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
