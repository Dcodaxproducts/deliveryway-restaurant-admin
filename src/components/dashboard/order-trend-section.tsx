"use client";

import PieStatsGraph from "./PieStatsGraph";
import OrdersGraph from "../graphs/orders-graph";

export default function AnalyticsGrid() {
  return (
   <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] w-full">

      {/* Pie chart section */}
      <PieStatsGraph />

      {/* Line chart section */}
      <OrdersGraph />
    </div>
  );
}
