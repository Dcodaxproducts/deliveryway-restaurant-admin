import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AbstractIntlMessages } from "next-intl";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import { StatePanel } from "@/components/common/EmptyState";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import StatsSection from "@/components/pages/Employees/components/employee-settings/stats-section";
import EmployeeTable from "@/components/pages/Employees/components/employee-settings/table";
import EmployeesSettingsPage from "./EmployeesSettingsPage";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  active: false, cursor: 0, state: [] as unknown[], isBranchAdmin: false,
  result: { data: undefined as unknown, isLoading: false, isFetching: false, isError: false },
  staffQuery: vi.fn(), statsQuery: vi.fn(), refetch: vi.fn(), mutate: vi.fn(),
}));
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
    useEffect: (...args: Parameters<typeof react.useEffect>) => { if (!harness.active) react.useEffect(...args); },
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
vi.mock("next/navigation", () => ({ usePathname: () => "/employees-settings" }));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ restaurantId: "restaurant-1", branchId: "branch-1", isBranchAdmin: harness.isBranchAdmin }) }));
vi.mock("@/hooks/useEmployees", () => ({
  useGetStaffList: (params: unknown) => { harness.staffQuery(params); return { ...harness.result, refetch: harness.refetch }; },
  useDeleteStaff: () => ({ mutate: harness.mutate }),
  useUpdateStaffStatus: () => ({ mutate: harness.mutate }),
}));
vi.mock("@/hooks/useDashboard", () => ({
  useGetEmployeesStats: (params: unknown) => { harness.statsQuery(params); return { ...harness.result, refetch: harness.refetch }; },
}));
vi.mock("@/hooks/useBranches", () => ({ useGetBranches: () => ({ data: [], isLoading: false }) }));
vi.mock("@/components/pages/Employees/components/employee-settings/AddEmployeeModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Employees/components/employee-settings/header", () => ({ default: () => null }));
vi.mock("@/components/pages/Employees/components/employee-settings/RolesTable", () => ({ default: () => null }));

type Node = ReactElement<Record<string, unknown>>;
function nodes(tree: ReactNode): Node[] {
  return Children.toArray(tree).flatMap((child) => isValidElement<Record<string, unknown>>(child)
    ? [child, ...nodes(child.props.children as ReactNode)] : []);
}
function run(component: () => ReactNode) {
  harness.active = true;
  harness.cursor = 0;
  try { return component(); } finally { harness.active = false; }
}
const employee = { id: "staff-1", firstName: "Fixture", lastName: "Employee", email: "fixture@example.test", isActive: true };
const cases = [
  { name: "employee list", render: () => EmployeeTable({}), data: { data: [employee], meta: { page: 1, total: 1, totalPages: 1, limit: 10 } }, component: ResponsiveDataView, identity: "Fixture Employee" },
  { name: "employee stats", render: EmployeesSettingsPage, data: { data: { totalEmployees: 17, activeEmployees: 12, inactiveEmployees: 5, totalRoles: 3 } }, component: StatsSection, identity: ">17<" },
];
beforeEach(() => {
  vi.clearAllMocks();
  harness.locale = "en";
  harness.refetch.mockReset();
  harness.state = [];
  harness.isBranchAdmin = false;
  harness.result = { data: undefined, isLoading: false, isFetching: false, isError: false };
});

describe.each(cases)("$name read failures", (entry) => {
  it.each([false, true])("handles a rejected initial network request or refresh (cached=%s), then recovers", async (cached) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    let resolveRetry!: (value: unknown) => void;
    const network = vi.fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
    const observer = new QueryObserver(client, { queryKey: [entry.name], queryFn: network, initialData: cached ? entry.data : undefined });
    const unsubscribe = observer.subscribe((result) => { harness.result = result; });
    try {
      await observer.refetch({ cancelRefetch: false });
      expect(network).toHaveBeenCalledTimes(1);
      expect(harness.result.isError).toBe(true);
      if (!cached) expect(harness.result.data).toBeUndefined();
      const tree = run(entry.render);
      const panel = nodes(tree).find((node) => node.type === StatePanel && node.props.state === "error")!;
      expect(renderToStaticMarkup(panel)).toContain('data-state="error"');
      const content = nodes(tree).find((node) => node.type === entry.component);
      if (cached) {
        expect(content).toBeDefined();
        const markup = renderToStaticMarkup(content);
        expect(markup).toContain(entry.identity);
        expect(markup).not.toContain("animate-pulse");
      } else {
        expect(content).toBeUndefined();
      }
      const retry = panel.props.action as ReactElement<{ disabled: boolean; onClick: () => void }>;
      expect(retry.props.disabled).toBe(false);
      let pending!: ReturnType<typeof observer.refetch>;
      harness.refetch.mockImplementation(() => { pending = observer.refetch(); return pending; });
      retry.props.onClick();
      expect(harness.refetch).toHaveBeenCalledTimes(1);
      expect(harness.result.isFetching).toBe(true);
      const retrying = nodes(run(entry.render));
      for (const error of retrying.filter((node) => node.type === StatePanel && node.props.state === "error")) {
        expect((error.props.action as ReactElement<{ disabled: boolean }>).props.disabled).toBe(true);
      }
      const pendingContent = retrying.find((node) => node.type === entry.component)!;
      expect(pendingContent.props.loading).toBe(!cached);
      resolveRetry(entry.data);
      await pending;
      const recovered = nodes(run(entry.render));
      expect(recovered.some((node) => node.type === StatePanel && node.props.state === "error")).toBe(false);
      expect(renderToStaticMarkup(recovered.find((node) => node.type === entry.component))).toContain(entry.identity);
    } finally { unsubscribe(); client.clear(); }
  });

  it("disables retry during a failed refresh and never fabricates empty results or zero stats", () => {
    harness.result = { data: undefined, isError: true, isFetching: true, isLoading: false };
    const tree = nodes(run(entry.render));
    expect(tree.some((node) => node.type === entry.component)).toBe(false);
    const panel = tree.find((node) => node.type === StatePanel)!;
    expect((panel.props.action as ReactElement<{ disabled: boolean }>).props.disabled).toBe(true);
  });

  it("keeps cached content visible throughout a background fetch", () => {
    harness.result = { data: entry.data, isError: false, isFetching: true, isLoading: false };
    const content = nodes(run(entry.render)).find((node) => node.type === entry.component)!;
    expect(content.props.loading).toBe(false);
    expect(renderToStaticMarkup(content)).toContain(entry.identity);
  });
});

it("renders genuine successful empty employee data and zero stats", () => {
  harness.result.data = { data: [] };
  expect(renderToStaticMarkup(run(() => EmployeeTable({})))).toContain('data-state="empty"');
  harness.state = [];
  harness.result.data = { data: { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0, totalRoles: 0 } };
  const stats = nodes(run(EmployeesSettingsPage)).find((node) => node.type === StatsSection)!;
  expect(renderToStaticMarkup(stats).match(/>0<\/p>/g)).toHaveLength(4);
});

it.each([false, true])("preserves employee list and stats branch scope (branchAdmin=%s)", (branchAdmin) => {
  harness.isBranchAdmin = branchAdmin;
  run(() => EmployeeTable({ branchId: "selected-branch", search: "chef" }));
  expect(harness.staffQuery).toHaveBeenLastCalledWith(branchAdmin
    ? { page: 1, search: "chef" }
    : { page: 1, search: "chef", restaurantId: "restaurant-1", branchId: "selected-branch" });
  harness.state = ["selected-branch"];
  run(EmployeesSettingsPage);
  expect(harness.statsQuery).toHaveBeenLastCalledWith({ branchId: branchAdmin ? "branch-1" : "selected-branch" });
});

it("uses existing common status translations rather than missing employee keys", () => {
  harness.result.data = { data: [employee] };
  const markup = renderToStaticMarkup(run(() => EmployeeTable({})));
  expect(markup).toContain(en.common.active);
  expect(markup).not.toContain("employees.active");
});

describe.each(["en", "de"] as const)("%s employee feedback translations", (locale) => {
  it.each(cases)("renders meaningful translated $name errors and retry labels", ({ render }) => {
    harness.locale = locale;
    const messages = locale === "en" ? en : de;
    harness.result.isError = true;
    const panel = nodes(run(render)).find((node) => node.type === StatePanel)!;
    const markup = renderToStaticMarkup(panel);
    expect(markup).toContain(messages.common.unableToLoad);
    expect(markup).toContain(messages.common.refresh);
    expect(markup).not.toMatch(/common\.|employees\./);
    if (locale === "de") expect(markup).not.toMatch(/Unable to load|>Refresh</);
    const retry = panel.props.action as ReactElement<{ onClick: () => void }>;
    retry.props.onClick();
    expect(harness.refetch).toHaveBeenCalledExactlyOnceWith();
    expect(harness.mutate).not.toHaveBeenCalled();
  });
});
