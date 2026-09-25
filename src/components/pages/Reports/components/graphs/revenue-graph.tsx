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
import { ChartPanel } from "@/components/common/ChartPanel";
import { StatePanel } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useGetRevenueTrend } from "@/hooks/useDashboard";
import { formatMoney } from "@/lib/currency";
import { useTranslations } from "next-intl";
import type { DashboardTrendParams } from "@/services/dashboard/dashboard.api";

export type TrendRange = "daily" | "weekly" | "monthly";

type RevenuePoint = {
  key: string;
  label: string;
  value: number;
  cumulativeTotal: number;
};

const RevenueGraph = ({
  range: controlledRange,
  onRangeChange,
  params,
}: {
  range?: TrendRange;
  onRangeChange?: (range: TrendRange) => void;
  params?: DashboardTrendParams;
} = {}) => {
  const common = useTranslations("common");
  const t = useTranslations("reports");
  const {
    restaurantId,
    branchId,
    isBranchAdmin,
    loading: authLoading,
  } = useAuth();
  const { currency: fallbackCurrency } = useCurrency(restaurantId);
  const [localRange, setLocalRange] = useState<TrendRange>("daily");
  const range = controlledRange ?? localRange;
  const setRange = onRangeChange ?? setLocalRange;
  const trendParams = params
    ? { ...params, range }
    : restaurantId
      ? {
          restaurantId,
          ...(isBranchAdmin && branchId ? { branchId } : {}),
          range,
        }
      : undefined;

  const {
    data: revenueTrendResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetRevenueTrend(trendParams);

  const trendData = revenueTrendResponse?.data;
  const hasData = trendData != null;

  const currency = trendData?.currency || fallbackCurrency;
  const currentRange = trendData?.range || range;

  const chartData = useMemo<
    Array<{
      key: string;
      day: string;
      revenue: number;
      cumulativeTotal: number;
    }>
  >(() => {
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

  const loading =
    !hasData && !isError && (authLoading || isLoading || isFetching);

  return (
    <ChartPanel title={null}>
      <div className="mb-5 flex min-w-0 flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-semibold text-dark">
              {t("revenueTrend")}
            </h3>

            {(loading || hasData) && (
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {hasData
                  ? formatMoney(Number(trendData.totalRevenueInRange), currency)
                  : common("loading")}
              </div>
            )}

            {hasOnlyOneRevenuePoint ? (
              <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                Single revenue point
              </div>
            ) : null}
          </div>

          <p className="mt-1 text-xs leading-4 text-gray-400">
            Track revenue across the selected{" "}
            <span className="capitalize">{currentRange}</span> range
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 2xl:justify-end">
          <SegmentedControl
            value={range}
            onValueChange={setRange}
            ariaLabel={t("revenueTrendRange")}
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
            aria-label={t("refreshRevenueTrend")}
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
          title={t(
            hasData ? "revenueTrendRefreshFailed" : "revenueTrendFailed",
          )}
          description={
            hasData ? t("revenueTrendCached") : common("refreshAndTry")
          }
          action={
            <Button
              type="button"
              variant="outline"
              disabled={authLoading || isFetching}
              onClick={() => refetch()}
            >
              {t("retryRevenueTrend")}
            </Button>
          }
        />
      )}

      {(!isError || hasData) && (
        <div className="h-[220px] w-full min-w-0">
          {loading ? (
            <div
              role="status"
              aria-label={common("loading")}
              className="h-full w-full animate-pulse rounded-[16px] bg-gray-100"
            />
          ) : !hasData ? (
            <StatePanel
              state="unavailable"
              title={t("revenueTrendUnavailable")}
              description={common("refreshAndTry")}
            />
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[16px] border border-dashed border-gray-200 text-sm text-gray-400">
              {t("noRevenueTrendData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <defs>
                  <linearGradient
                    id="revenuePurpleGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient
                    id="revenueRedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
      )}
    </ChartPanel>
  );
};

export default RevenueGraph;
