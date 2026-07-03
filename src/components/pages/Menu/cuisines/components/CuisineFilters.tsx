import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative w-full max-w-[420px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          placeholder="Search cuisines..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex h-[44px] overflow-hidden rounded-[14px] border border-gray-200 bg-[#FAFAFA] p-1">
        {statusOptions.map((option) => {
          const isSelected = statusFilter === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusFilterChange(option.value)}
              className={`rounded-[10px] px-3 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <Button
        onClick={onSearch}
        disabled={disabled}
        className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm disabled:opacity-60"
      >
        Search
      </Button>
    </div>
  );
}
