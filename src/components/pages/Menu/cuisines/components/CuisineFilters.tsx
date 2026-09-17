import { FilterBar } from "@/components/common/FilterBar";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { SearchField } from "@/components/common/SearchField";

export type CuisineStatusFilter = "all" | "active" | "inactive";

type CuisineFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: CuisineStatusFilter;
  onStatusFilterChange: (value: CuisineStatusFilter) => void;
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
  disabled = false,
}: CuisineFiltersProps) {
  return (
    <FilterBar
      className="mb-6"
      search={<div className="w-full max-w-[420px]">
        <SearchField
          placeholder="Search cuisines..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange("")}
          className="h-10 bg-[var(--ui-surface-subtle)]"
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
    />
  );
}
