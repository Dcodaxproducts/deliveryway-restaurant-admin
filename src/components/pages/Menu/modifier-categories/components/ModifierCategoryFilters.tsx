import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModifierCategoryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  inactive: boolean;
  onInactiveChange: (value: boolean) => void;
  onSearch: () => void;
  disabled?: boolean;
};

export default function ModifierCategoryFilters({
  search,
  onSearchChange,
  inactive,
  onInactiveChange,
  onSearch,
  disabled = false,
}: ModifierCategoryFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative w-full max-w-[420px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          placeholder="Search categories..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <label className="flex h-[44px] items-center gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={inactive}
          onChange={(event) => onInactiveChange(event.target.checked)}
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        Show inactive
      </label>

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
