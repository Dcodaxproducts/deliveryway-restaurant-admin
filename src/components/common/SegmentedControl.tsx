import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  size?: "compact" | "default";
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  disabled = false,
  size = "compact",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="segmented-control"
      className={cn(
        "flex min-w-0 items-center rounded-[var(--ui-radius-compact)] bg-[var(--ui-surface-subtle)] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "min-w-0 flex-1 rounded-[var(--ui-radius-control)] font-medium transition-[background-color,color,box-shadow,transform] duration-[var(--ui-motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus-ring)] focus-visible:ring-offset-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
              size === "default" ? "h-10 px-3 text-sm" : "h-8 px-2.5 text-xs",
              active
                ? "bg-[var(--ui-surface)] text-primary shadow-[var(--ui-shadow-xs)] ring-1 ring-primary/15 hover:bg-[var(--ui-surface)] hover:text-primary"
                : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface)]/75 hover:text-[var(--ui-text)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
