import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageTabOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
};

type PageTabsProps<T extends string> = {
  value: T;
  options: readonly PageTabOption<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function PageTabs<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  className,
}: PageTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-slot="page-tabs"
      className={cn(
        "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[var(--ui-radius-compact)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1 shadow-[var(--ui-shadow-xs)]",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ui-radius-control)] px-3 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-[var(--ui-motion-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus-ring)] focus-visible:ring-offset-1 active:translate-y-px",
              active
                ? "bg-[var(--ui-brand-soft)] text-primary shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-brand-soft)] hover:text-primary"
                : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-subtle)] hover:text-[var(--ui-text)]",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
