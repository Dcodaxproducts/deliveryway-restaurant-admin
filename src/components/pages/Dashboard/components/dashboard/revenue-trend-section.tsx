"use client";
import RevenueGraph from "@/components/pages/Reports/components/graphs/revenue-graph";
import type { TrendRange } from "@/components/pages/Reports/components/graphs/revenue-graph";

export default function RevenueAnalytics({
  range,
  onRangeChange,
}: {
  range?: TrendRange;
  onRangeChange?: (range: TrendRange) => void;
}) {
  return <RevenueGraph range={range} onRangeChange={onRangeChange} />;
}
