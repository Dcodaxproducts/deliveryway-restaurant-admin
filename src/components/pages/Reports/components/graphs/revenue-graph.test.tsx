import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChartPanelProps } from "@/components/common/ChartPanel";
import { formatMoney } from "@/lib/currency";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import RevenueGraph from "./revenue-graph";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  trend: { data: undefined as unknown, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() },
  query: vi.fn(), currencyQuery: vi.fn(), branchAdmin: false, authLoading: false,
  chartChildren: null as ReactNode,
  chartData: [] as unknown[],
  chartElements: null as ReactNode,
}));

vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return { ...original, useTranslations: (namespace: string) => original.createTranslator({
    locale: harness.locale,
    messages: (harness.locale === "en" ? en : de) as AbstractIntlMessages,
    namespace,
    onError: (error) => { throw error; },
  }) };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({
  restaurantId: "restaurant-1", branchId: "branch-1", isBranchAdmin: harness.branchAdmin, loading: harness.authLoading,
}) }));
vi.mock("@/hooks/useCurrency", () => ({ useCurrency: (id: string) => {
  harness.currencyQuery(id);
  return { currency: "USD" };
} }));
vi.mock("@/hooks/useDashboard", () => ({ useGetRevenueTrend: (params: unknown) => {
  harness.query(params);
  return harness.trend;
} }));
vi.mock("@/components/common/ChartPanel", async (importOriginal) => {
  const { ChartPanel } = await importOriginal<typeof import("@/components/common/ChartPanel")>();
  return { ChartPanel: (props: ChartPanelProps) => {
    harness.chartChildren = props.children;
    return <ChartPanel {...props} />;
  } };
});
// Capture real chart inputs; SSR has no browser dimensions for Recharts.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
  LineChart: ({ data, children }: { data: unknown[]; children: ReactNode }) => {
    harness.chartData = data;
    harness.chartElements = children;
    return <div data-testid="revenue-chart" />;
  },
  Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  Area: () => null, CartesianGrid: () => null,
}));

function nodes(tree: ReactNode): ReactElement<Record<string, unknown>>[] {
  return Children.toArray(tree).flatMap((child) => isValidElement<Record<string, unknown>>(child)
    ? [child, ...nodes(child.props.children as ReactNode), ...nodes(child.props.action as ReactNode)] : []);
}

function action(label: string) {
  const found = nodes(harness.chartChildren).find((node) =>
    node.props["aria-label"] === label || node.props.children === label);
  expect(found, `Missing action: ${label}`).toBeDefined();
  return found!;
}

const response = {
  data: {
    range: "daily", currency: "EUR", totalRevenueInRange: 1234.56,
    points: [
      { key: "2026-09-10", label: "Sep 10", value: 1300.25, cumulativeTotal: 1400.25 },
      { key: "2026-09-11", label: "Sep 11", value: -65.69, cumulativeTotal: 1334.56 },
    ],
  },
};

describe.each(["en", "de"] as const)("%s Revenue Trend feedback", (locale) => {
  const t = createTranslator({ locale, messages: locale === "en" ? en : de, namespace: "reports" });
  beforeEach(() => {
    vi.clearAllMocks();
    harness.locale = locale;
    harness.branchAdmin = harness.authLoading = false;
    harness.chartData = [];
    harness.chartChildren = harness.chartElements = null;
    Object.assign(harness.trend, { data: undefined, isLoading: false, isFetching: false, isError: false });
  });

  it.each([false, true])("renders an initial error without invented zero/empty data (retrying=%s)", (fetching) => {
    harness.trend.isError = true;
    harness.trend.isFetching = fetching;
    const markup = renderToStaticMarkup(<RevenueGraph />);
    expect(markup).toContain('data-state="error"');
    expect(markup).toContain(t("revenueTrendFailed"));
    expect(markup).not.toContain(formatMoney(0, "USD"));
    expect(markup).not.toContain(t("noRevenueTrendData"));
    expect(markup).not.toContain("animate-pulse");
    expect(markup).not.toContain('data-testid="revenue-chart"');
    expect(action(t("retryRevenueTrend")).props.disabled).toBe(fetching);
    expect(action(t("refreshRevenueTrend")).props.disabled).toBe(fetching);
    if (!fetching) {
      (action(t("retryRevenueTrend")).props.onClick as () => void)();
      expect(harness.trend.refetch).toHaveBeenCalledExactlyOnceWith();
    }
  });

  it("renders initial loading without inventing a total", () => {
    harness.trend.isLoading = harness.trend.isFetching = true;
    const markup = renderToStaticMarkup(<RevenueGraph />);
    expect(markup).toContain("animate-pulse");
    expect(markup).not.toContain(formatMoney(0, "USD"));
    expect(markup).not.toContain(t("noRevenueTrendData"));
    expect(action(t("refreshRevenueTrend")).props.disabled).toBe(true);
  });

  it("renders missing responses as unavailable rather than successful zero", () => {
    const markup = renderToStaticMarkup(<RevenueGraph />);
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).not.toContain(formatMoney(0, "USD"));
    expect(markup).not.toContain(t("noRevenueTrendData"));
  });

  it.each([false, true])("retains genuine zero/empty data and labels stale results (failed=%s)", (failed) => {
    harness.trend.data = { data: { range: "daily", currency: "EUR", totalRevenueInRange: 0, points: [] } };
    harness.trend.isError = failed;
    const markup = renderToStaticMarkup(<RevenueGraph />);
    expect(markup).toContain(formatMoney(0, "EUR"));
    expect(markup).toContain(t("noRevenueTrendData"));
    expect(markup.includes('data-state="error"')).toBe(failed);
    if (failed) expect(markup).toContain(t("revenueTrendCached"));
  });

  it.each(["success", "fetching", "failed", "retrying"])("keeps server currency, decimals, signed points and totals during %s", (state) => {
    harness.trend.data = response;
    harness.trend.isFetching = state === "fetching" || state === "retrying";
    harness.trend.isError = state === "failed" || state === "retrying";
    const markup = renderToStaticMarkup(<RevenueGraph />);
    expect(markup).toContain(formatMoney(1234.56, "EUR"));
    expect(markup).toContain('data-testid="revenue-chart"');
    expect(markup).not.toContain("animate-pulse");
    expect(harness.chartData).toEqual(response.data.points.map((point) => ({
      key: point.key, day: point.label, revenue: point.value, cumulativeTotal: point.cumulativeTotal,
    })));
    expect(harness.trend.data).toBe(response);
    expect(markup.includes(t("revenueTrendRefreshFailed"))).toBe(harness.trend.isError);
    if (harness.trend.isError) {
      expect(markup).toContain(t("revenueTrendCached"));
      expect(action(t("retryRevenueTrend")).props.disabled).toBe(harness.trend.isFetching);
      if (!harness.trend.isFetching) {
        (action(t("retryRevenueTrend")).props.onClick as () => void)();
        expect(harness.trend.refetch).toHaveBeenCalledExactlyOnceWith();
      }
    }
    expect(action(t("refreshRevenueTrend")).props.disabled).toBe(harness.trend.isFetching);
  });

  it("retains the currency fallback and numeric-string conversion", () => {
    harness.trend.data = { data: { range: "daily", totalRevenueInRange: "12.34", points: [] } };
    expect(renderToStaticMarkup(<RevenueGraph />)).toContain(formatMoney(12.34, "USD"));
    expect(harness.currencyQuery).toHaveBeenCalledExactlyOnceWith("restaurant-1");
  });

  it("keeps axis and tooltip currency formatting unchanged", () => {
    harness.trend.data = response;
    renderToStaticMarkup(<RevenueGraph />);
    const axis = nodes(harness.chartElements).find((node) => node.props.tickFormatter);
    const tooltip = nodes(harness.chartElements).find((node) => node.props.formatter);
    expect((axis!.props.tickFormatter as (value: number) => string)(12.34)).toBe(formatMoney(12.34, "EUR"));
    expect((tooltip!.props.formatter as (value: number, name: string) => unknown)(12.34, "revenue"))
      .toEqual([formatMoney(12.34, "EUR"), "Revenue"]);
  });

  it("preserves branch scope, Reports controlled ranges and parameterless refresh", () => {
    harness.branchAdmin = true;
    const change = vi.fn();
    renderToStaticMarkup(<RevenueGraph range="monthly" onRangeChange={change} />);
    expect(harness.query).toHaveBeenCalledExactlyOnceWith({ restaurantId: "restaurant-1", branchId: "branch-1", range: "monthly" });
    (action("weekly").props.onClick as () => void)();
    expect(change).toHaveBeenCalledExactlyOnceWith("weekly");
    (action(t("refreshRevenueTrend")).props.onClick as () => void)();
    expect(harness.trend.refetch).toHaveBeenCalledExactlyOnceWith();
  });

  it("keeps Dashboard's default range and disables refresh during auth loading", () => {
    harness.authLoading = true;
    renderToStaticMarkup(<RevenueGraph />);
    expect(harness.query).toHaveBeenCalledExactlyOnceWith({ restaurantId: "restaurant-1", range: "daily" });
    expect(action(t("refreshRevenueTrend")).props.disabled).toBe(true);
  });
});
