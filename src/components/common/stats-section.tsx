import { StatItem } from "@/types/stats";
import StatsCard from "../cards/stats-card";
import { cn } from "@/lib/utils";

export type StatGridProps = {
  stats: StatItem[];
  className?: string;
  loading?: boolean;
  columns?: 2 | 3 | 4;
};

const columnClassNames = {
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
} as const;

export function StatGrid({
  stats,
  className,
  loading = false,
  columns = 4,
}: StatGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5",
        columnClassNames[columns],
        className,
      )}
    >
      {stats.map((stat) => (
        <StatsCard key={stat._id} data={stat} loading={loading} />
      ))}
    </div>
  );
}

export default StatGrid;
