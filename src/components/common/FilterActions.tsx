import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterActionsProps = {
  searchLabel: string;
  resetLabel: string;
  onSearch: () => void;
  onReset: () => void;
  searchDisabled?: boolean;
  resetDisabled?: boolean;
  className?: string;
};

export function FilterActions({
  searchLabel,
  resetLabel,
  onSearch,
  onReset,
  searchDisabled = false,
  resetDisabled = false,
  className,
}: FilterActionsProps) {
  return (
    <div
      data-slot="filter-actions"
      className={cn(
        "grid min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center",
        className,
      )}
    >
      <Button
        type="button"
        disabled={searchDisabled}
        onClick={onSearch}
        className="w-full min-w-0 px-4 sm:w-auto sm:min-w-[88px]"
      >
        {searchLabel}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={resetDisabled}
        onClick={onReset}
        className="w-full min-w-0 px-4 text-[var(--ui-text)] sm:w-auto sm:min-w-[104px]"
      >
        <RefreshCcw aria-hidden="true" />
        {resetLabel}
      </Button>
    </div>
  );
}
