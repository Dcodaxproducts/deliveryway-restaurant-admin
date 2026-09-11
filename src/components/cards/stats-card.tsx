import { Card } from "@/components/ui/card";
import { StatItem, StatIcon } from "@/types/stats";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Store,
  ShoppingBag,
  Banknote,
  Users,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<StatIcon, React.ElementType> = {
  store: Store,
  orders: ShoppingBag,
  revenue: Banknote,
  users: Users,
  completed: CheckCircle,
  cancelled: XCircle,
  ongoing: Loader,
};

export type StatCardProps = {
  data: StatItem;
  loading?: boolean;
  variant?: "plain" | "outlined";
  className?: string;
};

export const StatCard = ({
  data,
  loading = false,
  variant = "outlined",
  className,
}: StatCardProps) => {

  const hasTrend = Boolean(data.trend?.percentage);
  const isUp = data.trend?.direction === "up";
  const Icon = ICON_MAP[data.icon];
  const isDanger = data.iconStyle === "danger";

  return (
    <Card
      data-slot="stat-card"
      className={cn(
        "gap-0 rounded-[var(--ui-radius-card)] bg-[var(--ui-surface)] p-3.5 shadow-none",
        variant === "outlined" ? "border border-[var(--ui-border)]" : "border-none",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] p-1.5",
            isDanger
              ? "bg-[var(--ui-danger-soft)] text-[var(--ui-danger)]"
              : "bg-[var(--ui-brand-soft)] text-primary",
          )}
        >
          {loading ? (
            <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
          ) : (
            <Icon size={16} aria-hidden="true" />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          {loading ? (
            <>
              <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200 sm:h-10" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded-md bg-gray-200" />
              <div className="mt-2 h-4 w-20 animate-pulse rounded-md bg-gray-200" />
            </>
          ) : (
            <>
              <div className="text-base font-semibold leading-none tabular-nums text-[var(--ui-text)]">
                {data.value}
              </div>

              <p className="mt-1 text-pretty text-[11px] leading-4 text-[var(--ui-text-muted)]">
                {data.title}
              </p>

              {hasTrend ? (
                <div
                  className={cn(
                    "mt-1.5 flex items-center gap-1 text-[11px] font-medium tabular-nums",
                    isUp ? "text-[var(--ui-success)]" : "text-[var(--ui-danger)]",
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight aria-hidden="true" size={16} strokeWidth={2.5} />
                  )}
                  {data.trend?.percentage}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
