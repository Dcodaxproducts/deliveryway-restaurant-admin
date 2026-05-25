import { StatItem } from "@/types/stats";
import StatsCard from "../cards/stats-card";
import { cn } from "@/lib/utils";

export default function StatsSection({
  stats,
  className,
  loading = false,
}: {
  stats: StatItem[];
  className?: string;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-[16px] sm:gap-[10px] md:gap-[24px]",
        className
      )}
    >
      {stats.map((stat) => (
        <StatsCard key={stat._id} data={stat} loading={loading} />
      ))}
    </div>
  );
}