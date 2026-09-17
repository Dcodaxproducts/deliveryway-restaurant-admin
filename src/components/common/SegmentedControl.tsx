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
        "scroll-hidden flex w-fit max-w-full min-w-0 items-center gap-1 overflow-x-auto rounded-[var(--ui-radius-compact)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 shadow-[var(--ui-shadow-xs)]",
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
              "shrink-0 whitespace-nowrap rounded-[var(--ui-radius-control)] font-medium transition-[background-color,color,box-shadow,transform] duration-[var(--ui-motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus-ring)] focus-visible:ring-offset-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
              size === "default" ? "h-9 px-3 text-sm" : "h-8 px-2.5 text-xs",
              active
                ? "bg-[var(--ui-brand-soft)] text-primary shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-brand-soft)] hover:text-primary"
                : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
