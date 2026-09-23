import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import { ResponsiveDataView, type ResponsiveDataViewProps } from "@/components/common/ResponsiveDataView";
import { StatePanel } from "@/components/common/EmptyState";
import StatsSection from "@/components/common/stats-section";
import CustomerStats from "@/components/pages/Customers/components/customer-settings/stats-section";
import DeliverymanStats from "@/components/pages/Deliverymen/components/deliveryman/stats-section";
import Home from "./DashboardPage";
import NotificationsPage from "@/components/pages/notifications/pages/NotificationsPage";
import Notifications from "@/components/pages/Notifications/components/notifications/Notification";
import { BranchesPage } from "@/components/pages/branches/pages/BranchesPage";
import BranchesClient from "@/components/pages/Branches/components/BranchesClient";
import BranchesList from "@/components/pages/Branches/components/list";
import CustomersPage from "@/components/pages/customers/pages/CustomersPage";
import CustomerTable from "@/components/pages/Customers/components/customer-settings/table";
import DeliverymenPage from "@/components/pages/deliverymen/pages/DeliverymenPage";
import DeliveryManTable from "@/components/pages/Deliverymen/components/deliveryman/table";
import InventoryPage from "@/components/pages/inventory/pages/InventoryPage";
import CuisinesTable from "@/components/pages/Menu/cuisines/components/CuisinesTable";
import PaginationSection from "@/components/common/PaginationSection";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  active: false, cursor: 0, state: [] as unknown[],
  restaurantId: "restaurant-1" as string | null, branchId: "branch-1" as string | null,
  branchAdmin: false, authLoading: false,
  list: { data: undefined as unknown, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() },
  stats: { data: undefined as unknown, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() },
  query: vi.fn(), statsQuery: vi.fn(), inventoryQuery: vi.fn(), mutation: vi.fn(),
  inventoryRetries: { items: vi.fn(), movements: vi.fn(), recipes: vi.fn(), categories: vi.fn() },
}));

// Inspect feature props/actions, then render the real canonical data and state UI.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: <T,>(initial: T | (() => T)) => {
      if (!harness.active) return react.useState(initial);
      const index = harness.cursor++;
      if (!(index in harness.state)) harness.state[index] = typeof initial === "function" ? (initial as () => T)() : initial;
      return [harness.state[index], (value: T | ((previous: T) => T)) => {
        harness.state[index] = typeof value === "function" ? (value as (previous: T) => T)(harness.state[index] as T) : value;
      }];
    },
    useMemo: <T,>(factory: () => T, deps: unknown[]) => harness.active ? factory() : react.useMemo(factory, deps),
    useEffect: (effect: () => void | (() => void), deps: unknown[]) => {
      if (!harness.active) react.useEffect(effect, deps);
    },
  };
});
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
vi.mock("next/navigation", () => ({ usePathname: () => "/test", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("@/components/cards/BranchCard", () => ({ BranchCard: ({ name }: { name: string }) => <article>{name}</article> }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({
  restaurantId: harness.restaurantId, branchId: harness.branchId,
  user: { restaurantId: harness.restaurantId }, isBranchAdmin: harness.branchAdmin, loading: harness.authLoading,
}) }));
vi.mock("@/hooks/useDashboard", () => ({
  useGetRestaurantDashboardOverview: (params: unknown) => { harness.statsQuery(params); return harness.stats; },
  useGetCustomersStats: (params: unknown) => { harness.statsQuery(params); return harness.stats; },
  useGetDeliverymenStats: (params: unknown) => { harness.statsQuery(params); return harness.stats; },
}));
vi.mock("@/hooks/useBranches", () => ({ useGetBranches: (params: unknown) => { harness.query(params); return harness.list; } }));
vi.mock("@/hooks/useCustomers", () => ({
  useGetCustomersList: (params: unknown) => { harness.query(params); return harness.list; },
  useDeleteCustomer: () => ({ mutateAsync: harness.mutation }),
  useUpdateCustomerStatus: () => ({ mutateAsync: harness.mutation }),
}));
vi.mock("@/hooks/useDeliverymen", () => ({
  useDeliverymen: (params: unknown) => { harness.query(params); return harness.list; },
  useDeleteDeliveryman: () => ({ mutateAsync: harness.mutation }),
  useUpdateDeliverymanStatus: () => ({ mutateAsync: harness.mutation }),
}));
vi.mock("@/hooks/useCuisines", () => ({ useCuisines: (params: unknown) => { harness.query(params); return harness.list; } }));
vi.mock("@/hooks/useNotifications", () => ({
  useGetNotifications: (params: unknown) => { harness.query(params); return harness.list; },
  useMarkNotificationSeen: () => ({ mutate: harness.mutation }),
}));
vi.mock("@/hooks/useInventory", () => ({
  useInventoryItems: (params: unknown) => { harness.inventoryQuery("items", params); return { ...harness.list, refetch: harness.inventoryRetries.items }; },
  useInventoryMovements: (params: unknown) => { harness.inventoryQuery("movements", params); return { ...harness.list, refetch: harness.inventoryRetries.movements }; },
  useInventoryRecipes: (params: unknown) => { harness.inventoryQuery("recipes", params); return { ...harness.list, refetch: harness.inventoryRetries.recipes }; },
  useInventoryCategories: (params: unknown) => { harness.inventoryQuery("categories", params); return { ...harness.list, refetch: harness.inventoryRetries.categories }; },
  useCreateInventoryMovement: () => ({ mutate: harness.mutation, isPending: false }),
}));
vi.mock("@/components/pages/Branches/components/header", () => ({ default: () => null }));
vi.mock("@/components/pages/BranchWorkspace/components/branch-admin/BranchWorkspace", () => ({ default: () => null }));
vi.mock("@/components/pages/Customers/components/customer-settings/header", () => ({ default: () => null }));
vi.mock("@/components/pages/Customers/components/customer-settings/AddCustomerModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Customers/components/customer-settings/CustomerDetailModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/header", () => ({ default: () => null }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/AssignOrderModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Deliverymen/components/deliveryman/DeliveryManDetails", () => ({ default: () => null }));
vi.mock("@/components/pages/Notifications/components/notifications/header", () => ({ default: () => null }));
vi.mock("@/components/pages/Dashboard/components/dashboard/order-trend-section", () => ({ default: () => null }));
vi.mock("@/components/pages/Dashboard/components/dashboard/revenue-trend-section", () => ({ default: () => null }));

type Node = ReactElement<Record<string, unknown>>;
function nodes(tree: ReactNode): Node[] {
  return Children.toArray(tree).flatMap((child) => isValidElement<Record<string, unknown>>(child)
    ? [child, ...nodes(child.props.children as ReactNode), ...nodes(child.props.action as ReactNode)] : []);
}
function element<P>(tree: ReactNode, type: unknown): ReactElement<P> {
  const result = nodes(tree).find((node) => node.type === type);
  expect(result).toBeDefined();
  return result as ReactElement<P>;
}
function run(render: () => ReactNode, state: unknown[] = []) {
  harness.cursor = 0;
  harness.state = state;
  harness.active = true;
  try { return render(); } finally { harness.active = false; }
}
function button(tree: ReactNode, label: string) {
  const result = nodes(tree).find((node) => Children.toArray(node.props.children as ReactNode).includes(label));
  expect(result, `missing button: ${label}`).toBeDefined();
  return result!;
}
function feedback(tree: ReactNode) {
  return renderToStaticMarkup(<>{nodes(tree).filter((node) => node.type === StatePanel)}</>);
}
function branchesPage() {
  const restaurantPage = BranchesPage() as ReactElement;
  return (restaurantPage.type as () => ReactNode)();
}
function listView(tree: ReactNode, name: string) {
  if (name === "branches") {
    const client = element<ComponentProps<typeof BranchesClient>>(tree, BranchesClient);
    const list = element<ComponentProps<typeof BranchesList>>(run(() => BranchesClient(client.props)), BranchesList);
    tree = run(() => BranchesList(list.props));
  } else if (name === "customers") {
    const table = element<ComponentProps<typeof CustomerTable>>(tree, CustomerTable);
    tree = run(() => CustomerTable(table.props));
  } else if (name === "deliverymen") {
    const table = element<ComponentProps<typeof DeliveryManTable>>(tree, DeliveryManTable);
    tree = run(() => DeliveryManTable(table.props));
  }
  return element<ResponsiveDataViewProps<{ id: string; key: string }>>(tree, ResponsiveDataView);
}

const branch = { id: "branch-1", name: "Central branch", isActive: true };
const customer = { id: "customer-1", profile: { firstName: "Pat", lastName: "Customer" }, email: "pat@example.test" };
const deliveryman = { id: "deliveryman-1", firstName: "Sam", lastName: "Driver", status: "AVAILABLE" };
const cuisine = { id: "cuisine-1", name: "Italian", slug: "italian", restaurantId: null };
const stock = { id: "stock-1", name: "Flour", quantity: 12 };
const notification = { id: "notification-1", type: "CUSTOM", title: "Kitchen alert", seen: false };
const meta = { page: 1, limit: 10, total: 21, totalPages: 3, hasNext: true, hasPrevious: false };
const lists = [
  { name: "branches", render: branchesPage, row: branch, text: "Central branch", retry: "Retry branches" },
  { name: "customers", render: CustomersPage, row: customer, text: "Pat Customer", retry: "Retry customers" },
  { name: "deliverymen", render: DeliverymenPage, row: deliveryman, text: "Sam Driver", retry: "Retry deliverymen" },
  { name: "cuisines", render: CuisinesTable, row: cuisine, text: "Italian", retry: "Retry cuisines" },
  { name: "inventory", render: InventoryPage, row: stock, text: "Flour", retry: "Retry inventory" },
] as const;
const metrics = [
  { name: "overview", render: Home, component: StatsSection, retry: "Retry dashboard overview", data: { totalOrders: 0, totalRevenue: 0, totalCustomers: 0, availableDeliverymen: 0, activeEmployees: 0 } },
  { name: "customers", render: CustomersPage, component: CustomerStats, retry: "Retry customer metrics", data: { totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0, newCustomersLast30Days: 0 } },
  { name: "deliverymen", render: DeliverymenPage, component: DeliverymanStats, retry: "Retry deliveryman metrics", data: { totalDeliverymen: 0, activeDeliverymen: 0, inactiveDeliverymen: 0, statusBreakdown: [] } },
];

beforeEach(() => {
  vi.clearAllMocks();
  harness.locale = "en";
  harness.restaurantId = "restaurant-1";
  harness.branchId = "branch-1";
  harness.branchAdmin = harness.authLoading = false;
  Object.assign(harness.list, { data: undefined, isLoading: false, isFetching: false, isError: false });
  Object.assign(harness.stats, { data: undefined, isLoading: false, isFetching: false, isError: false });
});

describe.each(lists)("$name feedback", ({ name, render, row, text, retry }) => {
  it("passes initial query failures through canonical desktop and mobile errors, not empty", () => {
    harness.list.isError = true;
    const tree = run(render);
    const markup = renderToStaticMarkup(listView(tree, name));
    expect(markup.match(/data-state="error"/g)).toHaveLength(2);
    expect(markup).not.toContain('data-state="empty"');
    expect(markup).not.toContain(text);
    (button(tree, retry).props.onClick as () => void)();
    expect(name === "inventory" ? harness.inventoryRetries.items : harness.list.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.stats.refetch).not.toHaveBeenCalled();
    expect(harness.mutation).not.toHaveBeenCalled();
  });

  it("shows loading rather than empty while the first request is running", () => {
    harness.list.isLoading = harness.list.isFetching = true;
    const markup = renderToStaticMarkup(listView(run(render), name));
    expect(markup).toContain('data-slot="data-table-skeleton"');
    expect(markup).not.toContain('data-state="empty"');
  });

  it("shows canonical empty feedback only for a successful empty list", () => {
    harness.list.data = { data: [], meta: { ...meta, total: 0, totalPages: 1 } };
    const tree = run(render);
    const markup = renderToStaticMarkup(listView(tree, name));
    expect(markup.match(/data-state="empty"/g)).toHaveLength(2);
    expect(markup).not.toContain('data-state="error"');
    expect(nodes(tree).some((node) => node.props.children === retry)).toBe(false);
  });

  it.each([false, true])("retains loaded rows on refresh (failed=%s)", (failed) => {
    const response = { data: [row], meta };
    harness.list.data = response;
    harness.list.isFetching = !failed;
    harness.list.isError = failed;
    const tree = run(render);
    const view = listView(tree, name);
    expect(view.props.loading).toBe(false);
    expect(view.props.error).toBeNull();
    const markup = renderToStaticMarkup(view);
    expect(markup).toContain(text);
    expect(markup).not.toContain('data-slot="data-table-skeleton"');
    expect(feedback(tree).includes('data-state="error"')).toBe(failed);
    expect(harness.list.data).toBe(response);
    expect(response.data).toEqual([row]);
  });

  it("disables retry during an in-flight retry and keeps cached rows visible", () => {
    harness.list.data = { data: [row], meta };
    harness.list.isError = harness.list.isFetching = true;
    const tree = run(render);
    expect(button(tree, retry).props.disabled).toBe(true);
    expect(renderToStaticMarkup(listView(tree, name))).toContain(text);
  });
});

describe.each(metrics)("$name metrics", ({ name, render, component, retry, data }) => {
  it("does not render fabricated zero cards on a failed initial request", () => {
    harness.stats.isError = true;
    const tree = run(render);
    expect(nodes(tree).some((node) => node.type === component)).toBe(false);
    expect(feedback(tree)).toContain('data-state="error"');
    (button(tree, retry).props.onClick as () => void)();
    expect(harness.stats.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.list.refetch).not.toHaveBeenCalled();
  });

  it.each(["loading", "unavailable"])("uses canonical %s for missing metrics", (state) => {
    harness.stats.isLoading = state === "loading";
    const tree = run(render);
    if (name === "overview" && state === "loading") {
      const cards = element<{ loading?: boolean }>(tree, component);
      expect(cards.props.loading).toBe(true);
      expect(renderToStaticMarkup(cards).match(/data-slot="stat-card"/g)).toHaveLength(5);
      expect(feedback(tree)).not.toContain('data-state="loading"');
    } else {
      expect(nodes(tree).some((node) => node.type === component)).toBe(false);
      expect(feedback(tree)).toContain(`data-state="${state}"`);
    }
  });

  it("renders valid zero metrics as data", () => {
    harness.stats.data = { data };
    const tree = run(render);
    const cards = element<{ loading?: boolean }>(tree, component);
    expect(cards.props.loading).toBeFalsy();
    expect(renderToStaticMarkup(cards)).toMatch(/>0<\/(?:p|div)>/);
    expect(feedback(tree)).not.toContain('data-state="error"');
  });

  it.each([false, true])("retains original metrics on refresh (failed=%s)", (failed) => {
    const original = { ...data, totalOrders: 17, totalCustomers: 17, totalDeliverymen: 17 };
    harness.stats.data = { data: original };
    harness.stats.isFetching = true;
    harness.stats.isError = failed;
    const tree = run(render);
    const cards = element<{ loading?: boolean }>(tree, component);
    expect(cards.props.loading).toBeFalsy();
    expect(renderToStaticMarkup(cards)).toMatch(/>17<\/(?:p|div)>/);
    expect(feedback(tree).includes('data-state="error"')).toBe(failed);
    if (failed) expect(button(tree, retry).props.disabled).toBe(true);
  });
});

describe("notifications feedback", () => {
  it("shows an initial query error without an empty notification panel", () => {
    harness.list.isError = true;
    const tree = run(NotificationsPage);
    expect(feedback(tree)).toContain('data-state="error"');
    expect(nodes(tree).some((node) => node.type === Notifications)).toBe(false);
    (button(tree, "Retry notifications").props.onClick as () => void)();
    expect(harness.list.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.mutation).not.toHaveBeenCalled();
  });

  it.each([false, true])("retains notifications during refresh (failed=%s)", (failed) => {
    harness.list.data = { data: [notification] };
    harness.list.isFetching = true;
    harness.list.isError = failed;
    const tree = run(NotificationsPage);
    const list = element<ComponentProps<typeof Notifications>>(tree, Notifications);
    expect(list.props.notifications).toEqual([notification]);
    expect(list.props.loading).toBe(false);
    expect(renderToStaticMarkup(list)).toContain("Kitchen alert");
    expect(feedback(tree).includes('data-state="error"')).toBe(failed);
    if (failed) expect(button(tree, "Retry notifications").props.disabled).toBe(true);
  });

  it.each(["loading", "empty"])("keeps canonical %s notification feedback", (state) => {
    harness.list.isLoading = state === "loading";
    harness.list.data = state === "empty" ? { data: [] } : undefined;
    const list = element<ComponentProps<typeof Notifications>>(run(NotificationsPage), Notifications);
    expect(renderToStaticMarkup(list)).toContain(`data-state="${state}"`);
  });

  it("does not show empty when refreshing a previously empty list fails", () => {
    harness.list.data = { data: [] };
    harness.list.isError = true;
    const tree = run(NotificationsPage);
    expect(feedback(tree)).toContain('data-state="error"');
    expect(nodes(tree).some((node) => node.type === Notifications)).toBe(false);
  });

  it.each([false, true])("does not show empty or retry without restaurant context (authLoading=%s)", (loading) => {
    harness.restaurantId = null;
    harness.authLoading = loading;
    const tree = run(NotificationsPage);
    expect(feedback(tree)).toContain(`data-state="${loading ? "loading" : "unavailable"}"`);
    expect(nodes(tree).some((node) => node.type === Notifications)).toBe(false);
    expect(harness.query).toHaveBeenLastCalledWith(undefined);
  });
});

describe("query and retry contracts", () => {
  it("shows an explicit deliveryman restriction without a selected restaurant", () => {
    harness.restaurantId = null;

    const tree = run(DeliverymenPage);
    const markup = renderToStaticMarkup(tree);

    expect(markup).toContain("Please select a restaurant");
    expect(nodes(tree).some((node) => node.type === DeliveryManTable)).toBe(false);
  });

  it.each([
    { render: CustomersPage, component: CustomerStats, name: "customers", row: customer, data: { totalCustomers: 17 } },
    { render: DeliverymenPage, component: DeliverymanStats, name: "deliverymen", row: deliveryman, data: { totalDeliverymen: 17 } },
  ])("keeps $name list and metric failures independent", ({ render, component, name, row, data }) => {
    harness.stats.data = { data };
    harness.list.isError = true;
    let tree = run(render);
    expect(renderToStaticMarkup(element(tree, component))).toMatch(/>17<\/(?:p|div)>/);
    expect(renderToStaticMarkup(listView(tree, name))).toContain('data-state="error"');

    harness.stats.data = undefined;
    harness.stats.isError = true;
    harness.list.isError = false;
    harness.list.data = { data: [row], meta };
    tree = run(render);
    expect(nodes(tree).some((node) => node.type === component)).toBe(false);
    expect(listView(tree, name).props.data).toEqual([row]);
    expect(feedback(tree)).toContain('data-state="error"');
  });

  it("preserves branch list filters, metadata and pagination", () => {
    harness.list.data = { data: [branch], meta };
    const tree = run(branchesPage);
    expect(harness.query).toHaveBeenLastCalledWith({ search: "", sortOrder: "ASC", includeInactive: false, withDeleted: false, page: 1, restaurantId: "restaurant-1" });
    const client = element<ComponentProps<typeof BranchesClient>>(tree, BranchesClient);
    expect(client.props.meta).toBe(meta);
    const pagination = element<ComponentProps<typeof PaginationSection>>(run(() => BranchesClient(client.props)), PaginationSection);
    expect("meta" in pagination.props && pagination.props.meta).toBe(meta);
  });

  it.each([false, true])("preserves existing customer, deliveryman and overview scopes (branchAdmin=%s)", (branchAdmin) => {
    harness.branchAdmin = branchAdmin;
    const scope = { restaurantId: "restaurant-1", ...(branchAdmin ? { branchId: "branch-1" } : {}) };
    run(CustomersPage);
    expect(harness.query).toHaveBeenLastCalledWith({ page: 1, search: undefined, sortOrder: "DESC", withDeleted: false, includeInactive: true, isGuest: undefined, ...scope });
    expect(harness.statsQuery).toHaveBeenLastCalledWith(scope);
    run(DeliverymenPage);
    expect(harness.query).toHaveBeenLastCalledWith({ search: "", page: 1, limit: 10, status: undefined, restaurantId: "restaurant-1", branchId: branchAdmin ? "branch-1" : undefined });
    expect(harness.statsQuery).toHaveBeenLastCalledWith(scope);
    run(Home);
    expect(harness.statsQuery).toHaveBeenLastCalledWith(scope);
    run(NotificationsPage);
    expect(harness.query).toHaveBeenLastCalledWith({ ...scope, channel: "IN_APP" });
  });

  it("preserves cuisine filters and never sorts the cached response in place", () => {
    const older = { ...cuisine, createdAt: "2025-01-01" };
    const newer = { ...cuisine, id: "cuisine-2", createdAt: "2026-01-01" };
    const source = [older, newer];
    harness.list.data = { data: source, meta };
    const view = listView(run(CuisinesTable), "cuisines");
    expect(view.props.data.map((row) => row.id)).toEqual(["cuisine-2", "cuisine-1"]);
    expect(source).toEqual([older, newer]);
    expect(harness.query).toHaveBeenLastCalledWith({ page: 1, limit: 10, search: undefined, sortBy: "createdAt", sortOrder: "DESC", all: undefined, inactive: undefined, includeInactive: undefined });
  });

  it.each(["items", "movements", "recipes", "categories"] as const)("retries only the active inventory %s query", (tab) => {
    harness.list.isError = true;
    const tree = run(InventoryPage, [tab]);
    (button(tree, "Retry inventory").props.onClick as () => void)();
    for (const [key, refetch] of Object.entries(harness.inventoryRetries)) expect(refetch).toHaveBeenCalledTimes(key === tab ? 1 : 0);
    expect(harness.inventoryQuery).toHaveBeenCalledWith(tab, { restaurantId: "restaurant-1", branchId: "branch-1", search: undefined, page: 1, limit: 50 });
    expect(harness.mutation).not.toHaveBeenCalled();
  });

  it.each(["restaurant", "branch"])("does not display zero/empty inventory or retry without %s context", (missing) => {
    if (missing === "restaurant") harness.restaurantId = null;
    else harness.branchId = null;
    harness.list.isError = true;
    const tree = run(InventoryPage);
    expect(feedback(tree)).toContain('data-state="unavailable"');
    expect(nodes(tree).some((node) => node.type === ResponsiveDataView)).toBe(false);
    expect(nodes(tree).some((node) => node.props.children === "Retry inventory")).toBe(false);
    expect(renderToStaticMarkup(tree)).not.toContain("0 records");
  });

  it("keeps optional table error props compatible with existing callers", () => {
    for (const tree of [run(() => BranchesList({})), run(() => CustomerTable({})), run(() => DeliveryManTable({}))]) {
      const view = element<ResponsiveDataViewProps<unknown>>(tree, ResponsiveDataView);
      expect(view.props.error).toBeUndefined();
      expect(renderToStaticMarkup(view)).toContain('data-state="empty"');
    }
  });
});

describe.each(["en", "de"] as const)("%s introduced feedback translations", (locale) => {
  const messages = locale === "en" ? en : de;
  const t = createTranslator({ locale, messages, namespace: "common.feedback", onError: (error) => { throw error; } });
  beforeEach(() => { harness.locale = locale; });

  it.each(lists)("localizes initial and cached $name failures and retry without changing its target", ({ name, render, row }) => {
    harness.list.isError = true;
    let tree = run(render);
    const initialMarkup = renderToStaticMarkup(listView(tree, name));
    expect(initialMarkup).toContain(t("loadFailedDescription"));
    expect(initialMarkup).toContain(name === "inventory" || name === "cuisines"
      ? t("loadFailed", { subject: t(`subjects.${name}`) }) : messages.common.unableToLoad);
    if (locale === "de") expect(initialMarkup).not.toMatch(/Unable to load|Please try again/);
    const label = t("retry", { subject: t(`subjects.${name}`) });
    expect(label).toBe(locale === "en" ? `Retry ${name}` : `Erneut laden: ${messages.common.feedback.subjects[name]}`);
    (button(tree, label).props.onClick as () => void)();
    expect(name === "inventory" ? harness.inventoryRetries.items : harness.list.refetch).toHaveBeenCalledExactlyOnceWith();

    harness.list.data = { data: [row], meta };
    harness.list.isFetching = true;
    tree = run(render);
    const markup = feedback(tree);
    expect(markup).toContain(t("refreshFailed", { subject: t(`subjects.${name}`) }));
    expect(markup).toContain(t("cachedDescription"));
    expect(button(tree, label).props.disabled).toBe(true);
    if (locale === "de") expect(markup).not.toMatch(/Unable to|Showing the last|Please try again|Retry /);
  });

  it.each(metrics)("localizes $name metric failure, cached, loading and unavailable states", ({ name, render, data, component }) => {
    const subject = t(`subjects.${name === "customers" ? "customerMetrics" : name === "deliverymen" ? "deliverymanMetrics" : "overview"}`);
    harness.stats.isError = true;
    let tree = run(render);
    expect(feedback(tree)).toContain(t("loadFailed", { subject }));
    expect(feedback(tree)).toContain(t("loadFailedDescription"));
    (button(tree, t("retry", { subject })).props.onClick as () => void)();
    expect(harness.stats.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.list.refetch).not.toHaveBeenCalled();
    harness.stats.data = { data };
    expect(feedback(run(render))).toContain(t("cachedDescription"));
    harness.stats.data = undefined;
    harness.stats.isError = false;
    for (const loading of [false, true]) {
      harness.stats.isLoading = loading;
      tree = run(render);
      const markup = feedback(tree);
      if (loading && name === "overview") {
        const cards = element<{ loading?: boolean }>(tree, component);
        expect(cards.props.loading).toBe(true);
        expect(markup).not.toContain('data-state="loading"');
      } else {
        expect(markup).toContain(t(loading ? "loading" : "unavailable", { subject }));
        expect(markup).toContain(t("unavailableDescription"));
      }
      if (locale === "de") expect(markup).not.toMatch(/Loading |Unavailable:|Data will appear/);
    }
  });

  it("localizes notification errors, cached feedback and context states", () => {
    const subject = t("subjects.notifications");
    harness.list.isError = true;
    let tree = run(NotificationsPage);
    expect(feedback(tree)).toContain(t("loadFailed", { subject }));
    expect(feedback(tree)).toContain(t("loadFailedDescription"));
    (button(tree, t("retry", { subject })).props.onClick as () => void)();
    expect(harness.list.refetch).toHaveBeenCalledExactlyOnceWith();
    harness.list.data = { data: [notification] };
    expect(feedback(run(NotificationsPage))).toContain(t("cachedDescription"));
    harness.restaurantId = null;
    for (const loading of [false, true]) {
      harness.authLoading = loading;
      tree = run(NotificationsPage);
      expect(feedback(tree)).toContain(t(loading ? "loading" : "unavailable", { subject }));
      expect(feedback(tree)).toContain(t(loading ? "restaurantContextLoading" : "restaurantContextRequired"));
      if (locale === "de") expect(feedback(tree)).not.toMatch(/Loading |Unavailable:|Restaurant context is/);
    }
  });

  it("localizes inventory context feedback while leaving existing inventory controls outside scope", () => {
    harness.branchId = null;
    let markup = feedback(run(InventoryPage));
    expect(markup).toContain(t("unavailable", { subject: t("subjects.inventoryContext") }));
    expect(markup).toContain(t("inventoryContextRequired"));
    harness.authLoading = true;
    markup = feedback(run(InventoryPage));
    expect(markup).toContain(t("loading", { subject: t("subjects.inventory") }));
    expect(markup).toContain(t("inventoryContextLoading"));
    if (locale === "de") expect(markup).not.toMatch(/Loading inventory|Loading your inventory context/);
  });
});
