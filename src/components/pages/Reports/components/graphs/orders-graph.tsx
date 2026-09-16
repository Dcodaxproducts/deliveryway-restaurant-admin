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
import { ChartPanel } from "@/components/common/ChartPanel";
import { StatePanel } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGetOrdersTrend } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

export type TrendRange = "daily" | "weekly" | "monthly";

const OrdersGraph = ({
  range: controlledRange,
  onRangeChange,
}: {
  range?: TrendRange;
  onRangeChange?: (range: TrendRange) => void;
} = {}) => {
  const common = useTranslations("common");
  const t = useTranslations("reports");
  const {
    restaurantId,
    branchId,
    isBranchAdmin,
    loading: authLoading,
  } = useAuth();
  const [localRange, setLocalRange] = useState<TrendRange>("daily");
  const range = controlledRange ?? localRange;
  const setRange = onRangeChange ?? setLocalRange;

  const {
    data: ordersTrendResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetOrdersTrend(
    restaurantId
      ? {
          restaurantId,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
          range,
        }
      : undefined,
  );

  const trendData: {
    range: TrendRange;
    totalOrdersInRange: number;
    points: { key: string; label: string; value: number; cumulativeTotal: number }[];
  } | undefined = ordersTrendResponse?.data;
  const hasData = trendData != null;

  const chartData = useMemo(() => {
    return (
      trendData?.points?.map((point) => ({
        key: point.key,
        day: point.label,
        orders: point.value,
        cumulativeTotal: point.cumulativeTotal,
      })) || []
    );
  }, [trendData]);

  const currentRange = trendData?.range ?? range;

  const loading = !hasData && !isError && (authLoading || isLoading || isFetching);
  return (
    <ChartPanel title={null} className="h-full">
      <div className="mb-5 flex min-w-0 flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-semibold text-dark">
              {t("orderTrend")}
            </h3>

            {(loading || hasData) && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {trendData
                  ? t("ordersCount", { count: trendData.totalOrdersInRange })
                  : common("loading")}
              </div>
            )}
          </div>

          <p className="mt-1 text-xs leading-4 text-gray-400">
            {t("trackOrderVolume", { range: t(`trendRanges.${currentRange}`) })}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 2xl:justify-end">
          <SegmentedControl
            value={range}
            onValueChange={setRange}
            ariaLabel={t("orderTrendRange")}
            className="w-full sm:w-auto"
            options={(["daily", "weekly", "monthly"] as const).map((item) => ({
              value: item,
              label: t(`trendRanges.${item}`),
            }))}
          />

          <button
            type="button"
            onClick={() => refetch()}
            disabled={authLoading || isFetching}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[#E7EAF0] text-gray-500 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
            aria-label={t("refreshOrderTrend")}
            title={common("refresh")}
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {isError && (
        <StatePanel
          state="error"
          compact
          className="mb-4"
          title={t(hasData ? "orderTrendRefreshFailed" : "orderTrendFailed")}
          description={hasData ? t("orderTrendCached") : common("refreshAndTry")}
          action={
            <Button type="button" variant="outline" disabled={authLoading || isFetching} onClick={() => refetch()}>
              {t("retryOrderTrend")}
            </Button>
          }
        />
      )}

      {(!isError || hasData) && (
      <div className="h-[220px] w-full min-w-0">
        {loading ? (
          <div role="status" aria-label={common("loading")} className="h-full w-full animate-pulse rounded-[16px] bg-gray-100" />
        ) : !hasData ? (
          <StatePanel state="unavailable" title={t("orderTrendUnavailable")} description={common("refreshAndTry")} />
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-gray-200 text-sm text-gray-400">
            {t("noOrderTrendData")}
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
                formatter={(value: number) => [t("ordersCount", { count: value })]}
                labelFormatter={(label) => label}
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
      )}
    </ChartPanel>
  );
};

export default OrdersGraph;
