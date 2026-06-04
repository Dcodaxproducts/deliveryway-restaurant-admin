"use client";

import PieStatsGraph from "./PieStatsGraph";
import OrdersGraph from "@/components/pages/Reports/components/graphs/orders-graph";

export default function AnalyticsGrid() {
  return (
   <div className="grid w-full min-w-0 grid-cols-1 gap-[24px] overflow-hidden xl:grid-cols-2">

      {/* Pie chart section */}
      <PieStatsGraph />

      {/* Line chart section */}
      <OrdersGraph />
    </div>
  );
}
