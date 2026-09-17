import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  value: string | number;
  label: string;
  loading?: boolean;
};

export default function PromotionStatCard({
  icon,
  value,
  label,
  loading = false,
}: Props) {
  return (
    <div data-slot="stat-card" className="flex min-h-[88px] items-center gap-3 rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3.5">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] text-primary"
        )}
      >
        {loading ? (
          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
        ) : (
          icon
        )}
      </div>

      <div className="space-y-1 flex-1">
        {loading ? (
          <>
            <div className="h-7 w-14 rounded-md bg-gray-200 animate-pulse" />
            <div className="h-4 w-28 rounded-md bg-gray-200 animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-base font-semibold leading-none tabular-nums text-[var(--ui-text)]">{value ?? 0}</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--ui-text-muted)]">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}
