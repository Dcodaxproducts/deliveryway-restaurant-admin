import type { ReactNode } from "react";

import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export type ChartPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  metric?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  className?: string;
};

export function ChartPanel({
  title,
  description,
  metric,
  actions,
  children,
  loading = false,
  error,
  empty = false,
  emptyTitle = "No data available",
  emptyDescription = "Data will appear here when activity is recorded.",
  onRetry,
  className,
}: ChartPanelProps) {
  return (
    <SectionCard
      data-slot="chart-panel"
      padding="md"
      className={cn("h-full min-w-0", className)}
      title={
        <div className="flex flex-wrap items-center gap-3">
          <span>{title}</span>
          {metric ? (
            <span className="rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
              {metric}
            </span>
          ) : null}
        </div>
      }
      description={description}
      action={actions}
    >
      <div className="min-h-56">
        {loading ? (
          <div
            role="status"
            aria-label="Loading chart"
            className="h-56 animate-pulse rounded-[var(--ui-radius-card)] bg-[var(--ui-surface-subtle)]"
          />
        ) : error ? (
          <StatePanel
            state="error"
            title="Unable to load chart"
            description={error}
            action={
              onRetry ? (
                <button type="button" className="text-sm font-semibold text-primary" onClick={onRetry}>
                  Try again
                </button>
              ) : undefined
            }
            compact
          />
        ) : empty ? (
          <StatePanel
            state="empty"
            title={emptyTitle}
            description={emptyDescription}
            compact
          />
        ) : (
          children
        )}
      </div>
    </SectionCard>
  );
}
