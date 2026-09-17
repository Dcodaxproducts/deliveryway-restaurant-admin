"use client";

import { FormSelect } from "@/components/ui/form-select";

import { Loader2, RefreshCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/common/FilterBar";

export type GiftCardsFilterState = {
  search: string;
  lifecycle: string;
  branchId: string;
};

export type GiftCardBranchOption = {
  id: string;
  name: string;
};

type GiftCardsFiltersProps = {
  filters: GiftCardsFilterState;
  branchOptions: GiftCardBranchOption[];
  isBranchAdmin: boolean;
  branchName?: string;
  visibleCount: number;
  totalCount: number;
  isFetching: boolean;
  onFiltersChange: (filters: Partial<GiftCardsFilterState>) => void;
};

export default function GiftCardsFilters({
  filters,
  branchOptions,
  isBranchAdmin,
  branchName,
  visibleCount,
  totalCount,
  isFetching,
  onFiltersChange,
}: GiftCardsFiltersProps) {
  const t = useTranslations("promotions.giftCards");
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
      filters.branchId
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
    <FilterBar
      search={
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-medium text-[var(--ui-text-muted)]">
            {commonT("search")}
          </label>
          <div className="relative min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-subtle)]"
              size={17}
            />
            <input
              placeholder={t("searchPlaceholder")}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              className="h-10 w-full min-w-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ui-focus-ring)]"
            />
          </div>
        </div>
      }
      resultCount={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
            {totalCount > 0
              ? t("showingOf", { visible: visibleCount, total: totalCount })
              : commonT("shown", { count: visibleCount })}
          </span>
          {isFetching ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Loader2 size={12} className="animate-spin" />
              {commonT("refreshing")}
            </span>
          ) : null}
        </div>
      }
      filters={
        <>
          <FilterSelect
            label={t("lifecycleLabel")}
            value={filters.lifecycle}
            options={lifecycleOptions}
            onChange={(lifecycle) => onFiltersChange({ lifecycle })}
          />
          <div className="min-w-44">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            {commonT("branch")}
          </label>
          {isBranchAdmin ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full justify-start"
            >
              <span className="truncate">{branchName || commonT("currentBranch")}</span>
            </Button>
          ) : (
            <FormSelect
              value={filters.branchId || "ALL"}
              onChange={(event) => {
                const value = event.target.value;
                onFiltersChange({ branchId: value === "ALL" ? "" : value });
              }}
              className="h-10 w-full min-w-0 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ui-focus-ring)]"
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
        </>
      }
      actions={
        <>
          <Button type="button" onClick={handleSearch}>
            {commonT("search")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters && !isFetching}
            onClick={handleReset}
          >
            <RefreshCcw size={15} />
            {commonT("reset")}
          </Button>
        </>
      }
    />
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
        className="h-10 min-w-40 rounded-[var(--ui-radius-control)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--ui-focus-ring)]"
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
