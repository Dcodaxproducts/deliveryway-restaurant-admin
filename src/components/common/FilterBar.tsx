"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FilterBarProps = {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  resultCount?: ReactNode;
  className?: string;
};

export function FilterBar({
  search,
  filters,
  actions,
  resultCount,
  className,
}: FilterBarProps) {
  return (
    <div
      data-slot="filter-bar"
      className={cn(
        "flex flex-col gap-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:flex-row lg:items-end",
        className,
      )}
    >
      {search ? <div className="min-w-0 flex-1">{search}</div> : null}
      {filters ? <div className="flex min-w-0 flex-wrap items-end gap-3">{filters}</div> : null}
      {resultCount ? (
        <div className="text-sm tabular-nums text-[var(--ui-text-muted)] lg:ml-auto">
          {resultCount}
        </div>
      ) : null}
      {actions ? (
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export type FilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  applyLabel: string;
  resetLabel: string;
  onApply: () => void;
  onReset: () => void;
  applyDisabled?: boolean;
};

export function FilterSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  applyLabel,
  resetLabel,
  onApply,
  onReset,
  applyDisabled = false,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(92vw,420px)] bg-[var(--ui-surface)] sm:max-w-[420px]">
        <SheetHeader className="border-b border-[var(--ui-border)] px-5 py-5 pr-12 text-left">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <SheetFooter className="border-t border-[var(--ui-border)] px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onReset}>
            {resetLabel}
          </Button>
          <Button type="button" onClick={onApply} disabled={applyDisabled}>
            {applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
