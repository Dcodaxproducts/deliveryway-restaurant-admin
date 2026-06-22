"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useGetRevenueTrend } from "@/hooks/useDashboard";
import { formatMoney } from "@/lib/currency";

type TrendRange = "daily" | "weekly" | "monthly";

type RevenuePoint = {
  key: string;
  label: string;
  value: number;
  cumulativeTotal: number;
};

const RevenueGraph = () => {
  const { restaurantId, branchId, isBranchAdmin, loading: authLoading } = useAuth();
  const { currency: fallbackCurrency } = useCurrency(restaurantId);
  const [range, setRange] = useState<TrendRange>("daily");

  const {
    data: revenueTrendResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetRevenueTrend(
    restaurantId
      ? {
          restaurantId,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
          range,
        }
      : undefined
  );

  const trendData = revenueTrendResponse?.data;

  const currency = trendData?.currency || fallbackCurrency;
  const totalRevenueInRange = Number(trendData?.totalRevenueInRange || 0);
  const currentRange = trendData?.range || range;

  const chartData = useMemo<Array<{ key: string; day: string; revenue: number; cumulativeTotal: number }>>(() => {
    return (
      trendData?.points?.map((point: RevenuePoint) => ({
        key: point.key,
        day: point.label,
        revenue: Number(point.value || 0),
        cumulativeTotal: Number(point.cumulativeTotal || 0),
      })) || []
    );
  }, [trendData]);

  const hasOnlyOneRevenuePoint =
    chartData.filter((item) => item.revenue > 0).length === 1;

  const lineColor = hasOnlyOneRevenuePoint ? "#D41414" : "#6366F1";
  const gradientId = hasOnlyOneRevenuePoint
    ? "revenueRedGradient"
    : "revenuePurpleGradient";
  const shadowId = hasOnlyOneRevenuePoint
    ? "revenueRedShadow"
    : "revenuePurpleShadow";

  const loading = authLoading || isLoading || isFetching;

  return (
    <Card className="h-full min-w-0 overflow-hidden rounded-[16px] border-none bg-white p-[24px] shadow-none">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[18px] font-semibold text-dark">
              Revenue Trend
            </h3>

            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {loading
                ? "Loading..."
                : formatMoney(totalRevenueInRange, currency)}
            </div>

            {hasOnlyOneRevenuePoint ? (
              <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                Single revenue point
              </div>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-gray-400">
            Track revenue across the selected{" "}
            <span className="capitalize">{currentRange}</span> range
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:justify-end">
          <div className="flex min-w-0 flex-wrap items-center rounded-[12px] bg-[#F5F6F8] p-1">
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
            type="button"
            onClick={() => refetch()}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E7EAF0] text-gray-500 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            aria-label="Refresh revenue trend"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px] w-full min-w-0">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-[16px] bg-gray-100" />
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-red-200 text-center">
            <p className="text-sm font-medium text-red-500">
              Failed to load revenue trend.
            </p>

            <Button
              type="button"
              onClick={() => refetch()}
              className="h-9 rounded-[10px] bg-primary px-4 text-sm text-white hover:bg-primary/90"
            >
              Retry
            </Button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-gray-200 text-sm text-gray-400">
            No revenue trend data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="revenuePurpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>

                <linearGradient id="revenueRedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D41414" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D41414" stopOpacity={0} />
                </linearGradient>

                <filter id="revenuePurpleShadow" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="6"
                    stdDeviation="8"
                    floodColor="#6366F1"
                    floodOpacity="0.25"
                  />
                </filter>

                <filter id="revenueRedShadow" height="200%">
                  <feDropShadow
                    dx="0"
                    dy="6"
                    stdDeviation="8"
                    floodColor="#D41414"
                    floodOpacity="0.22"
                  />
                </filter>
              </defs>

              <CartesianGrid stroke="#EEF0F4" vertical={false} />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => {
                  return formatMoney(Number(value), currency);
                }}
              />

              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "revenue") {
                    return [formatMoney(value, currency), "Revenue"];
                  }

                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.key ? `Date: ${item.key}` : `Day: ${label}`;
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="none"
                fill={`url(#${gradientId})`}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke={lineColor}
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: lineColor,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 7 }}
                style={{ filter: `url(#${shadowId})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default RevenueGraph;
