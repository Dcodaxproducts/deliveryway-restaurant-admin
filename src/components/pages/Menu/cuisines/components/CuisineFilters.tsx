import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/common/FilterBar";
import { SegmentedControl } from "@/components/common/SegmentedControl";

export type CuisineStatusFilter = "all" | "active" | "inactive";

type CuisineFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: CuisineStatusFilter;
  onStatusFilterChange: (value: CuisineStatusFilter) => void;
  onSearch: () => void;
  disabled?: boolean;
};

const statusOptions: Array<{ value: CuisineStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active cuisines" },
  { value: "inactive", label: "Inactive cuisines" },
];

export default function CuisineFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSearch,
  disabled = false,
}: CuisineFiltersProps) {
  return (
    <FilterBar
      className="mb-6"
      search={<div className="relative w-full max-w-[420px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          placeholder="Search cuisines..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 w-full rounded-[var(--ui-radius-compact)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>}
      filters={
        <SegmentedControl
          value={statusFilter}
          options={statusOptions}
          onValueChange={onStatusFilterChange}
          ariaLabel="Cuisine status"
          disabled={disabled}
          size="default"
        />
      }
      actions={<Button
        onClick={onSearch}
        disabled={disabled}
        className="h-11 px-5 text-white shadow-sm disabled:opacity-60"
      >
        Search
      </Button>}
    />
  );
}
