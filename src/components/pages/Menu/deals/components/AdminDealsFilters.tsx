"use client";

import { Filter, Loader2, RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AdminDealSortOrder } from "@/types/admin-deals";

export type AdminDealsFilterState = {
  search: string;
  lifecycle: string;
  kind: string;
  discountType: string;
  branchId: string;
  includeInactive: boolean;
  withDeleted: boolean;
  sortBy: string;
  sortOrder: AdminDealSortOrder;
};

export type AdminDealBranchOption = {
  id: string;
  name: string;
};

type AdminDealsFiltersProps = {
  filters: AdminDealsFilterState;
  branchOptions: AdminDealBranchOption[];
  isBranchAdmin: boolean;
  branchName?: string;
  canViewDeleted: boolean;
  visibleCount: number;
  totalCount: number;
  isFetching: boolean;
  onFiltersChange: (filters: Partial<AdminDealsFilterState>) => void;
};

const lifecycleOptions = [
  { label: "All lifecycles", value: "ALL" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Ended", value: "ENDED" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Deleted", value: "DELETED" },
];

const kindOptions = [
  { label: "All kinds", value: "ALL" },
  { label: "Fixed Price", value: "FIXED_PRICE" },
  { label: "Item Deal", value: "ITEM_DEAL" },
  { label: "Bundle", value: "BUNDLE" },
];

const discountTypeOptions = [
  { label: "All discounts", value: "ALL" },
  { label: "Fixed Price", value: "FIXED_PRICE" },
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Flat", value: "FLAT" },
];

const sortByOptions = [
  { label: "Created at", value: "createdAt" },
  { label: "Starts at", value: "startsAt" },
  { label: "Expires at", value: "expiresAt" },
  { label: "Title", value: "title" },
  { label: "Fixed price", value: "discountValue" },
];

export default function AdminDealsFilters({
  filters,
  branchOptions,
  isBranchAdmin,
  branchName,
  canViewDeleted,
  visibleCount,
  totalCount,
  isFetching,
  onFiltersChange,
}: AdminDealsFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
      filters.search ||
      filters.lifecycle !== "ALL" ||
      filters.kind !== "ALL" ||
      filters.discountType !== "ALL" ||
      filters.branchId ||
      filters.includeInactive ||
      filters.withDeleted ||
      filters.sortBy !== "createdAt" ||
      filters.sortOrder !== "DESC"
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ search: searchValue.trim() });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [onFiltersChange, searchValue]);

  const handleSearch = () => {
    onFiltersChange({ search: searchValue.trim() });
  };

  const handleReset = () => {
    setSearchValue("");
    onFiltersChange({
      search: "",
      lifecycle: "ALL",
      kind: "ALL",
      discountType: "ALL",
      branchId: "",
      includeInactive: false,
      withDeleted: false,
      sortBy: "createdAt",
      sortOrder: "DESC",
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
            <h3 className="text-sm font-semibold text-gray-900">Deal Filters</h3>
            <p className="mt-1 text-xs text-gray-500">
              Filter fixed-price deals by title, lifecycle, type, and branch.
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
        <div className="min-w-0 xl:col-span-3">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Search
          </label>
          <div className="relative min-w-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              placeholder="Search deals..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <FilterSelect
          label="Lifecycle"
          value={filters.lifecycle}
          options={lifecycleOptions}
          onChange={(lifecycle) => onFiltersChange({ lifecycle })}
          className="xl:col-span-2"
        />

        <FilterSelect
          label="Kind"
          value={filters.kind}
          options={kindOptions}
          onChange={(kind) => onFiltersChange({ kind })}
          className="xl:col-span-2"
        />

        <FilterSelect
          label="Discount"
          value={filters.discountType}
          options={discountTypeOptions}
          onChange={(discountType) => onFiltersChange({ discountType })}
          className="xl:col-span-2"
        />

        <div className="min-w-0 xl:col-span-2">
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
          onClick={handleSearch}
          className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90 md:w-full xl:col-span-1"
        >
          Search
        </Button>

        <FilterSelect
          label="Sort By"
          value={filters.sortBy}
          options={sortByOptions}
          onChange={(sortBy) => onFiltersChange({ sortBy })}
          className="xl:col-span-3"
        />

        <FilterSelect
          label="Order"
          value={filters.sortOrder}
          options={[
            { label: "DESC", value: "DESC" },
            { label: "ASC", value: "ASC" },
          ]}
          onChange={(sortOrder) =>
            onFiltersChange({ sortOrder: sortOrder === "ASC" ? "ASC" : "DESC" })
          }
          className="xl:col-span-2"
        />

        <label className="flex h-[44px] items-center gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 xl:col-span-2">
          <input
            type="checkbox"
            checked={filters.includeInactive}
            onChange={(event) =>
              onFiltersChange({ includeInactive: event.target.checked })
            }
            className="accent-[var(--primary)]"
          />
          Include inactive
        </label>

        {canViewDeleted ? (
          <label className="flex h-[44px] items-center gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 xl:col-span-2">
            <input
              type="checkbox"
              checked={filters.withDeleted}
              onChange={(event) =>
                onFiltersChange({ withDeleted: event.target.checked })
              }
              className="accent-[var(--primary)]"
            />
            With deleted
          </label>
        ) : null}

        <Button
          type="button"
          variant="outline"
          disabled={!hasActiveFilters && !isFetching}
          onClick={handleReset}
          className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700 md:w-full xl:col-span-1"
        >
          <RefreshCcw size={15} className="mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
  className = "",
}: FilterSelectProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
