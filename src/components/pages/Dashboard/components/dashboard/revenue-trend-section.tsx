"use client";
import RevenueGraph from "@/components/pages/Reports/components/graphs/revenue-graph";
import type { TrendRange } from "@/components/pages/Reports/components/graphs/revenue-graph";
import type { DashboardTrendParams } from "@/services/dashboard/dashboard.api";

export default function RevenueAnalytics({
  range,
  onRangeChange,
  params,
}: {
  range?: TrendRange;
  onRangeChange?: (range: TrendRange) => void;
  params?: DashboardTrendParams;
}) {
  return (
    <RevenueGraph
      range={range}
      onRangeChange={onRangeChange}
      params={params}
    />
  );
}
