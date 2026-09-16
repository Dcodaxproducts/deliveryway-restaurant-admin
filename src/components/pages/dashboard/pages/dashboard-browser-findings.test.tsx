import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import type { ChartPanelProps } from "@/components/common/ChartPanel";
import { SegmentedControl, type SegmentedControlProps } from "@/components/common/SegmentedControl";
import type { RowActionsProps } from "@/components/common/RowActions";
import PieStatsGraph from "@/components/pages/Dashboard/components/dashboard/PieStatsGraph";
import OrdersGraph from "@/components/pages/Reports/components/graphs/orders-graph";
import BranchesList from "@/components/pages/Branches/components/list";
import CustomerTable from "@/components/pages/Customers/components/customer-settings/table";
import DeliveryManTable from "@/components/pages/Deliverymen/components/deliveryman/table";
import en from "@/messages/en.json";
import de from "@/messages/de.json";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  trend: { data: undefined as unknown, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() },
  query: vi.fn(), mutation: vi.fn(), branchAdmin: false, authLoading: false,
  chartChildren: null as ReactNode,
  chartData: [] as unknown[],
}));

// Real message interpolation with fail-fast errors, including hidden desktop/mobile call sites.
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: (namespace: string) => original.createTranslator({
      locale: harness.locale,
      messages: (harness.locale === "en" ? en : de) as AbstractIntlMessages,
      namespace,
      onError: (error) => { throw error; },
    }),
  };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("@/components/cards/BranchCard", () => ({ BranchCard: ({ name }: { name: string }) => <article>{name}</article> }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({
  restaurantId: "restaurant-1", branchId: "branch-1", isBranchAdmin: harness.branchAdmin, loading: harness.authLoading,
}) }));
vi.mock("@/hooks/useDashboard", () => ({ useGetOrdersTrend: (params: unknown) => {
  harness.query(params);
  return harness.trend;
} }));
vi.mock("@/hooks/useCustomers", () => ({
  useDeleteCustomer: () => ({ mutateAsync: harness.mutation }),
  useUpdateCustomerStatus: () => ({ mutateAsync: harness.mutation }),
}));
vi.mock("@/hooks/useDeliverymen", () => ({
  useDeleteDeliveryman: () => ({ mutateAsync: harness.mutation }),
  useUpdateDeliverymanStatus: () => ({ mutateAsync: harness.mutation }),
}));
vi.mock("@/components/pages/Customers/components/customer-settings/AddCustomerModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Customers/components/customer-settings/CustomerDetailModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/AssignOrderModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/DeliveryManDetails", () => ({ default: () => null }));
vi.mock("@/components/common/ChartPanel", async (importOriginal) => {
  const { ChartPanel } = await importOriginal<typeof import("@/components/common/ChartPanel")>();
  return { ChartPanel: (props: ChartPanelProps) => {
    harness.chartChildren = props.children;
    return <ChartPanel {...props} />;
  } };
});
// Render dropdown action text so both layout call sites are checked, not only the trigger.
vi.mock("@/components/common/RowActions", () => ({ RowActions: ({ actions }: RowActionsProps) =>
  <div>{actions.map((action) => <button key={action.id}>{action.label}</button>)}</div>,
}));
// Recharts needs browser dimensions; capture the exact data passed to the chart instead.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
  LineChart: ({ data }: { data: unknown[] }) => {
    harness.chartData = data;
    return <div data-testid="orders-chart" />;
  },
  Line: () => null, XAxis: () => null, Tooltip: () => null, Area: () => null,
}));

function nodes(tree: ReactNode): ReactElement<Record<string, unknown>>[] {
  return Children.toArray(tree).flatMap((child) => isValidElement<Record<string, unknown>>(child)
    ? [child, ...nodes(child.props.children as ReactNode), ...nodes(child.props.action as ReactNode)] : []);
}

function action(label: string) {
  const match = nodes(harness.chartChildren).find((node) =>
    node.props["aria-label"] === label || node.props.children === label);
  expect(match, `Missing action: ${label}`).toBeDefined();
  return match!;
}

const response = {
  data: {
    range: "daily", totalOrdersInRange: 37,
    points: [{ key: "2026-09-11", label: "Sep 11", value: 37, cumulativeTotal: 104 }],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  harness.chartData = [];
  harness.chartChildren = null;
  harness.branchAdmin = harness.authLoading = false;
  Object.assign(harness.trend, { data: undefined, isLoading: false, isFetching: false, isError: false });
});

describe.each(["en", "de"] as const)("%s dashboard browser findings", (locale) => {
  const messages = locale === "en" ? en : de;
  const t = createTranslator({ locale, messages, namespace: "reports" });
  beforeEach(() => { harness.locale = locale; });

  it.each(["populated", "zero", "loading", "failed"])("never fabricates donut percentages (%s)", (state) => {
    harness.trend.data = state === "populated" ? response : state === "zero" ? { data: { totalOrdersInRange: 0, points: [] } } : undefined;
    harness.trend.isError = state === "failed";
    harness.trend.isLoading = state === "loading";
    const markup = renderToStaticMarkup(<PieStatsGraph />);
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).toContain(messages.dashboard.percentagesUnavailable);
    expect(markup).not.toMatch(/\d+%|type="checkbox"|recharts/);
    expect(harness.query).not.toHaveBeenCalled();
  });

  it("shows initial failure, not a zero total or successful empty chart, and retries the existing query", () => {
    harness.trend.isError = true;
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain('data-state="error"');
    expect(markup).toContain(t("orderTrendFailed"));
    expect(markup).not.toContain(t("ordersCount", { count: 0 }));
    expect(markup).not.toContain(t("noOrderTrendData"));
    expect(markup).not.toContain("animate-pulse");
    (action(t("retryOrderTrend")).props.onClick as () => void)();
    expect(harness.trend.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.mutation).not.toHaveBeenCalled();
  });

  it("shows initial loading without fabricating a total", () => {
    harness.trend.isLoading = harness.trend.isFetching = true;
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain("animate-pulse");
    expect(markup).not.toContain(t("ordersCount", { count: 0 }));
    expect(markup).not.toContain(t("noOrderTrendData"));
    expect(action(t("refreshOrderTrend")).props.disabled).toBe(true);
  });

  it("renders unavailable for an absent response, not a successful zero", () => {
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain('data-state="unavailable"');
    expect(markup).not.toContain(t("ordersCount", { count: 0 }));
    expect(markup).not.toContain(t("noOrderTrendData"));
  });

  it("renders genuine successful zero and empty data", () => {
    harness.trend.data = { data: { range: "daily", totalOrdersInRange: 0, points: [] } };
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain(t("ordersCount", { count: 0 }));
    expect(markup).toContain(t("noOrderTrendData"));
    expect(markup).not.toContain('data-state="error"');
  });

  it.each(["success", "fetching", "failed", "retrying"])("preserves server totals and points during %s", (state) => {
    harness.trend.data = response;
    harness.trend.isFetching = state === "fetching" || state === "retrying";
    harness.trend.isError = state === "failed" || state === "retrying";
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain(t("ordersCount", { count: 37 }));
    expect(markup).toContain('data-testid="orders-chart"');
    expect(markup).not.toContain("animate-pulse");
    expect(harness.chartData).toEqual([{ key: "2026-09-11", day: "Sep 11", orders: 37, cumulativeTotal: 104 }]);
    expect(harness.trend.data).toBe(response);
    expect(markup.includes(t("orderTrendRefreshFailed"))).toBe(harness.trend.isError);
    if (harness.trend.isError) {
      expect(markup).toContain(t("orderTrendCached"));
      expect(action(t("retryOrderTrend")).props.disabled).toBe(harness.trend.isFetching);
    }
    expect(action(t("refreshOrderTrend")).props.disabled).toBe(harness.trend.isFetching);
  });

  it("keeps initial error visible and disables retries while retry is in flight", () => {
    harness.trend.isError = harness.trend.isFetching = true;
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain(t("orderTrendFailed"));
    expect(markup).not.toContain(t("ordersCount", { count: 0 }));
    expect(action(t("retryOrderTrend")).props.disabled).toBe(true);
    expect(action(t("refreshOrderTrend")).props.disabled).toBe(true);
  });

  it("labels a cached empty result as stale when refresh fails", () => {
    harness.trend.data = { data: { range: "daily", totalOrdersInRange: 0, points: [] } };
    harness.trend.isError = true;
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(markup).toContain(t("orderTrendRefreshFailed"));
    expect(markup).toContain(t("orderTrendCached"));
    expect(markup).toContain(t("ordersCount", { count: 0 }));
  });

  it("preserves branch scope, controlled report ranges, and refresh parameters", () => {
    harness.branchAdmin = true;
    const change = vi.fn();
    renderToStaticMarkup(<OrdersGraph range="monthly" onRangeChange={change} />);
    expect(harness.query).toHaveBeenCalledExactlyOnceWith({ restaurantId: "restaurant-1", branchId: "branch-1", range: "monthly" });
    const ranges = nodes(harness.chartChildren).find((node) => node.type === SegmentedControl) as
      | ReactElement<SegmentedControlProps<"daily" | "weekly" | "monthly">>
      | undefined;
    expect(ranges).toBeDefined();
    ranges!.props.onValueChange("weekly");
    expect(change).toHaveBeenCalledExactlyOnceWith("weekly");
    (action(t("refreshOrderTrend")).props.onClick as () => void)();
    expect(harness.trend.refetch).toHaveBeenCalledExactlyOnceWith();
  });

  it("retains the dashboard default range and restaurant-only scope", () => {
    const markup = renderToStaticMarkup(<OrdersGraph />);
    expect(harness.query).toHaveBeenCalledExactlyOnceWith({ restaurantId: "restaurant-1", range: "daily" });
    expect(markup).toContain('data-slot="segmented-control"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("hover:text-primary");
    expect(markup).toContain("h-[220px]");
    expect(markup).toContain("2xl:flex-row");
    expect(markup).not.toContain("h-[260px]");
  });

  it("resolves branch headings and detail actions using existing messages", () => {
    const markup = renderToStaticMarkup(<BranchesList branches={[{ id: "b1", name: "Central", address: "Main Street" }]} />);
    expect(markup).toContain(messages.common.address);
    expect(markup).toContain(messages.common.viewDetails);
    expect(markup).not.toMatch(/common\.(location|view)/);
  });

  it("resolves customer selection interpolation and both layouts' view actions", () => {
    const markup = renderToStaticMarkup(<CustomerTable customers={[{ id: "c1", profile: { firstName: "Pat", lastName: "Customer" } }]} />);
    expect(markup).toContain(messages.customers.table.selectAll);
    expect(markup).toContain(messages.customers.table.selectCustomer.replace("{name}", "Pat Customer"));
    expect(markup.split(messages.common.viewDetails)).toHaveLength(3);
    expect(markup).not.toMatch(/customers\.table|common\.view/);
  });

  it("resolves deliveryman view actions in desktop and mobile layouts", () => {
    const markup = renderToStaticMarkup(<DeliveryManTable data={[{ id: "d1", firstName: "Sam", status: "AVAILABLE" }]} />);
    expect(markup.split(messages.common.viewDetails)).toHaveLength(3);
    expect(markup).not.toContain("deliverymen.actions.view");
  });
});
