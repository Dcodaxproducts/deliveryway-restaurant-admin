"use client";

import { FormSelect } from "@/components/ui/form-select";

import { Filter, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FilterActions } from "@/components/common/FilterActions";
import { useTranslations } from "next-intl";

export type AdminDealsFilterState = {
  search: string;
  lifecycle: string;
  branchId: string;
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
  isFetching: boolean;
  onFiltersChange: (filters: Partial<AdminDealsFilterState>) => void;
};

export default function AdminDealsFilters({
  filters,
  branchOptions,
  isBranchAdmin,
  branchName,
  isFetching,
  onFiltersChange,
}: AdminDealsFiltersProps) {
  const t = useTranslations("deals");
  const commonT = useTranslations("common");
  const [searchValue, setSearchValue] = useState(filters.search);
  const lifecycleOptions = [
    { label: t("allLifecycles"), value: "ALL" },
    { label: t("lifecycle.active"), value: "active" },
    { label: t("lifecycle.scheduled"), value: "scheduled" },
    { label: t("lifecycle.expired"), value: "expired" },
    { label: t("lifecycle.inactive"), value: "inactive" },
  ];

  const hasActiveFilters = Boolean(
    searchValue.trim() ||
    filters.search ||
    filters.lifecycle !== "ALL" ||
    filters.branchId,
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
      branchId: "",
    });
  };

  return (
    <div className="w-full max-w-full overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] p-4">
      <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <Filter size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("filtersTitle")}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {t("filtersDescription")}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-gray-500">
          {isFetching ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Loader2 size={12} className="animate-spin" />
              {commonT("refreshing")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-12 2xl:items-end">
        <div className="min-w-0 2xl:col-span-3">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            {commonT("search")}
          </label>
          <div className="relative min-w-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              placeholder={t("searchPlaceholder")}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              className="h-10 w-full min-w-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] pl-11 pr-4 text-sm text-[var(--ui-text)] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <FilterSelect
          label={t("lifecycleLabel")}
          value={filters.lifecycle}
          options={lifecycleOptions}
          onChange={(lifecycle) => onFiltersChange({ lifecycle })}
          className="2xl:col-span-2"
        />

        <div className="min-w-0 2xl:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            {commonT("branch")}
          </label>
          {isBranchAdmin ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-10 w-full justify-start rounded-[var(--ui-radius-control)] bg-[var(--ui-surface)] px-3 text-[var(--ui-text-muted)]"
            >
              <span className="truncate">
                {branchName || commonT("currentBranch")}
              </span>
            </Button>
          ) : (
            <FormSelect
              value={filters.branchId || "ALL"}
              onChange={(event) => {
                const value = event.target.value;
                onFiltersChange({ branchId: value === "ALL" ? "" : value });
              }}
              className="h-10 w-full min-w-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              <option value="ALL">{commonT("allBranches")}</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </FormSelect>
          )}
        </div>

        <FilterActions
          searchLabel={commonT("search")}
          resetLabel={commonT("reset")}
          onSearch={handleSearch}
          onReset={handleReset}
          resetDisabled={!hasActiveFilters && !isFetching}
          className="md:col-span-2 2xl:col-span-5 2xl:justify-end"
        />
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
      <FormSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm text-[var(--ui-text)] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
