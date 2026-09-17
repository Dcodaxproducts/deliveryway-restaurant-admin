import { Search, X } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  onClear?: () => void;
};

export function SearchField({
  className,
  value,
  onClear,
  ...props
}: SearchFieldProps) {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div data-slot="search-field" className="relative min-w-0">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ui-text-subtle)]"
      />
      <Input
        type="search"
        value={value}
        className={cn(
          "h-10 rounded-[var(--ui-radius-control)] border-[var(--ui-border)] bg-[var(--ui-surface)] pl-10 text-sm [&::-webkit-search-cancel-button]:hidden",
          hasValue && onClear ? "pr-10" : "pr-3",
          className,
        )}
        {...props}
      />
      {hasValue && onClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-subtle)]"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
