import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterActionsProps = {
  resetLabel: string;
  onReset: () => void;
  resetDisabled?: boolean;
  className?: string;
};

export function FilterActions({
  resetLabel,
  onReset,
  resetDisabled = false,
  className,
}: FilterActionsProps) {
  return (
    <div
      data-slot="filter-actions"
      className={cn(
        "flex min-w-0 items-center",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        disabled={resetDisabled}
        onClick={onReset}
        className="w-full min-w-[96px] px-4 text-[var(--ui-text)] sm:w-auto"
      >
        <RefreshCcw aria-hidden="true" />
        {resetLabel}
      </Button>
    </div>
  );
}
