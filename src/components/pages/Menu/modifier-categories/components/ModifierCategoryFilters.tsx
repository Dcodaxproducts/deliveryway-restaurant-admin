import { SearchField } from "@/components/common/SearchField";

type ModifierCategoryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  inactive: boolean;
  onInactiveChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function ModifierCategoryFilters({
  search,
  onSearchChange,
  inactive,
  onInactiveChange,
  disabled = false,
}: ModifierCategoryFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="w-full max-w-[420px]">
        <SearchField
          placeholder="Search categories..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange("")}
          disabled={disabled}
          className="bg-[var(--ui-surface-subtle)]"
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

    </div>
  );
}
