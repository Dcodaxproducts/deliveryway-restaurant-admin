"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Area,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGetOrdersTrend } from "@/hooks/useDashboard";

type TrendRange = "daily" | "weekly" | "monthly";

const OrdersGraph = () => {
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const [range, setRange] = useState<TrendRange>("daily");

  const {
    data: ordersTrendResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetOrdersTrend(
    restaurantId
      ? {
          restaurantId,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
          range,
        }
      : undefined
  );

  const trendData = ordersTrendResponse?.data;

  const chartData = useMemo(() => {
    return (
      trendData?.points?.map((point: any) => ({
        key: point.key,
        day: point.label,
        orders: point.value,
        cumulativeTotal: point.cumulativeTotal,
      })) || []
    );
  }, [trendData]);

  const totalOrdersInRange = trendData?.totalOrdersInRange ?? 0;
  const currentRange = trendData?.range ?? range;

  const loading = authLoading || isLoading || isFetching;
return (
  <Card className="h-full rounded-[16px] border-none bg-white p-[24px] shadow-none">
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[18px] font-semibold text-dark">Order Trend</h3>

          <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {loading ? "Loading..." : `${totalOrdersInRange} orders`}
          </div>
        </div>

        <p className="mt-1 text-sm text-gray-400">
          Track order volume across the selected{" "}
          <span className="capitalize">{currentRange}</span> range
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center rounded-[12px] bg-[#F5F6F8] p-1">
          {(["daily", "weekly", "monthly"] as TrendRange[]).map((item) => {
            const active = range === item;

            return (
              <Button
                key={item}
                type="button"
                variant="ghost"
                onClick={() => setRange(item)}
                className={`h-9 rounded-[10px] px-4 text-sm font-medium capitalize transition-all ${
                  active
                    ? "bg-white text-primary shadow-sm hover:bg-white"
                    : "text-gray-500 hover:text-dark"
                }`}
              >
                {item}
              </Button>
            );
          })}
        </div>

        <button
          onClick={() => refetch()}
          className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E7EAF0] text-gray-500 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
          aria-label="Refresh order trend"
          title="Refresh"
        >
         <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>

    {/* Chart */}
    <div className="h-[260px] w-full">
      {loading ? (
        <div className="h-full w-full animate-pulse rounded-[16px] bg-gray-100" />
      ) : chartData.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-gray-200 text-sm text-gray-400">
          No order trend data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>

              <filter id="lineShadow" height="200%">
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="8"
                  floodColor="#6366F1"
                  floodOpacity="0.25"
                />
              </filter>
            </defs>

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />

            <Tooltip
              formatter={(value: number) => [`${value}`, "Orders"]}
              labelFormatter={(label) => `Day: ${label}`}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            />

            <Area
              type="monotone"
              dataKey="orders"
              stroke="none"
              fill="url(#lineGradient)"
            />

            <Line
              type="monotone"
              dataKey="orders"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ r: 5, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              style={{ filter: "url(#lineShadow)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
);
};

export default OrdersGraph;
