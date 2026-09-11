import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { StatePanel } from "@/components/common/EmptyState";
import { ResponsiveDataView, type ResponsiveDataViewProps } from "@/components/common/ResponsiveDataView";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import AllergenTable from "../allergens/AllergenTableLegacy";
import CategoriesTable from "../categories/CategoriesTableLegacy";
import MenuItemsTable from "./MenuItemsTableLegacy";
import LabelsTable from "../labels/LabelsTableLegacy";
import ModifiersTable from "../modifiers/ModifiersTableLegacy";
import { ModifierGroupsTableLegacy } from "../modifier-groups/ModifierGroupsTableLegacy";
import VariationsTable from "../variations/VariationsTableLegacy";

const harness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  needsRender: false,
  state: [] as unknown[],
  effects: [] as { effect: () => unknown; deps: readonly unknown[] | undefined }[],
  restaurantId: "restaurant-1" as string | null,
  branchId: "branch-1",
  isBranchAdmin: false,
  isMobile: false,
  isLoading: false,
  isFetching: false,
  isError: false,
  isPending: false,
  response: {} as unknown,
  query: vi.fn(),
  refetch: vi.fn(),
  mutate: vi.fn(),
  navigate: vi.fn(),
  scroll: vi.fn(),
}));

// Only the parent table's hooks are driven here. Canonical views and their
// children render through React, without a DOM dependency or a query provider.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: <T,>(initial: T | (() => T)) => {
      if (!harness.active) return react.useState(initial);
      const index = harness.cursor++;
      if (!(index in harness.state)) {
        harness.state[index] = typeof initial === "function" ? (initial as () => T)() : initial;
      }
      return [harness.state[index], (value: T | ((previous: T) => T)) => {
        const next = typeof value === "function"
          ? (value as (previous: T) => T)(harness.state[index] as T)
          : value;
        if (harness.active && !Object.is(next, harness.state[index])) harness.needsRender = true;
        harness.state[index] = next;
      }];
    },
    useMemo: <T,>(factory: () => T, dependencies: unknown[]) => harness.active ? factory() : react.useMemo(factory, dependencies),
    useCallback: <T extends (...args: never[]) => unknown>(callback: T, dependencies: unknown[]) => harness.active ? callback : react.useCallback(callback, dependencies),
    useEffect: (...args: Parameters<typeof react.useEffect>) => {
      if (!harness.active) react.useEffect(...args);
      else harness.effects.push({ effect: args[0], deps: args[1] });
    },
    useRef: <T,>(value: T) => harness.active ? { current: value } : react.useRef(value),
  };
});

vi.mock("next-intl", () => ({ useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key }));
vi.mock("next/navigation", () => ({ usePathname: () => "/menu/items", useRouter: () => ({ push: harness.navigate }) }));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ restaurantId: harness.restaurantId, branchId: harness.branchId, isBranchAdmin: harness.isBranchAdmin }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => harness.isMobile }));
vi.mock("@/hooks/useCurrency", () => ({ useCurrency: () => ({ formatMoney: (value: unknown) => `money:${value}` }) }));
vi.mock("@/hooks/useClickOutside", () => ({ useClickOutside: () => ({ current: null }) }));
vi.mock("@/hooks/useInfiniteScroll", () => ({ useInfiniteScroll: (options: unknown) => { harness.scroll(options); return { current: null }; } }));
vi.mock("@/hooks/useMenus", () => Object.fromEntries([
  "useGetMenuItems", "useGetMenuVariations", "useDeleteMenuItem", "useDuplicateMenuItem",
  "useReorderMenuItems", "useUpsertMenuItemBranchOverride", "useDeleteMenuVariation", "useDuplicateModifier",
].map((name) => [name, (params: unknown) => {
  if (name.startsWith("useGet")) harness.query(params);
  return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch, mutate: harness.mutate, isPending: harness.isPending };
}])));
vi.mock("@/hooks/useMenuCategories", () => Object.fromEntries([
  "useGetMenuCategories", "useDeleteMenuCategory", "useReorderMenuCategories", "useUpdateMenuCategory", "useUpsertMenuCategoryBranchOverride",
].map((name) => [name, (params: unknown) => {
  if (name === "useGetMenuCategories") harness.query(params);
  return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch, mutate: harness.mutate, isPending: harness.isPending };
}])));
vi.mock("@/hooks/useAllergen", () => Object.fromEntries([
  "useGetAllergenAdditiveTemplates", "useCreateAllergenAdditiveTemplate", "useDeleteAllergenAdditiveTemplate", "useUpdateAllergenAdditiveTemplates", "useUpdateSingleAllergenAdditiveTemplate",
].map((name) => [name, (params: unknown) => {
  if (name === "useGetAllergenAdditiveTemplates") harness.query(params);
  return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch, mutate: harness.mutate, isPending: harness.isPending };
}])));
vi.mock("@/hooks/useProductLabel", () => Object.fromEntries([
  "useGetMenuItemLabels", "useCreateMenuItemLabel", "useDeleteMenuItemLabel", "useUpdateMenuItemLabel",
].map((name) => [name, (params: unknown) => {
  if (name === "useGetMenuItemLabels") harness.query(params);
  return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch, mutate: harness.mutate, isPending: harness.isPending };
}])));
vi.mock("@/hooks/useModifiers", () => ({
  useModifiers: (params: unknown) => { harness.query(params); return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch }; },
  useDeleteModifier: () => ({ mutate: harness.mutate, isPending: harness.isPending }),
}));
vi.mock("@/hooks/useModifierGroups", () => ({
  useModifierGroups: (params: unknown) => { harness.query(params); return { data: harness.response, isLoading: harness.isLoading, isFetching: harness.isFetching, isError: harness.isError, refetch: harness.refetch }; },
  useDeleteModifierGroup: () => ({ mutate: harness.mutate, isPending: harness.isPending }),
}));
vi.mock("@/components/pages/Menu/legacy/ModifierModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Menu/legacy/ModifierGroupModal", () => ({ ModifierGroupModal: () => null }));
vi.mock("@/components/pages/Menu/modifier-groups/components/ManageGroupModifiersDialog", () => ({ ManageGroupModifiersDialog: () => null }));
vi.mock("@/components/pages/Menu/legacy/root-menu-components/listing/VariationModal", () => ({ default: () => null }));
vi.mock("@/components/pages/Menu/legacy/root-menu-components/listing/CreateCategoryModalParent", () => ({ default: () => null }));
vi.mock("@/components/pages/Menu/legacy/root-menu-components/CreateMenuItemModal/CreateMenuItemModal", () => ({ default: () => null }));
vi.mock("@/components/common/CategoryInfiniteSelect", () => ({ default: () => null }));
vi.mock("@/components/pages/Menu/modifiers/components/ModifierCategoryInfiniteSelect", () => ({ default: () => null }));

const row = {
  id: "row-1", name: "Fixture name", description: "Fixture description", code: "A1", label: "Fixture label", value: "fixture-label", type: "allergens",
  category: { name: "Fixture category" }, slug: "fixture-slug", price: "12.50", priceDelta: 3.5, prepTimeMinutes: 7,
  isActive: true, isDefault: true, minSelect: 1, maxSelect: 3, modifiers: [{ id: "modifier-1" }], sortOrder: 4,
};
type Row = typeof row;
type Node = ReactElement<Record<string, unknown>>;
type Family = {
  name: string;
  component: (props: { refetchKey?: number }) => ReactNode;
  columns: string[];
  accumulated?: number;
  loaded?: number;
  selected: number;
  deleted: number;
};
const families: Family[] = [
  { name: "allergens", component: AllergenTable, columns: ["order", "code", "label", "type", "usage", "actions"], accumulated: 6, selected: 9, deleted: 11 },
  { name: "categories", component: CategoriesTable, columns: ["order", "category", "description", "slug", "status", "actions"], accumulated: 6, loaded: 7, selected: 9, deleted: 11 },
  { name: "items", component: MenuItemsTable, columns: ["order", "item", "category", "price", "prep", "status", "actions"], accumulated: 6, loaded: 7, selected: 9, deleted: 11 },
  { name: "labels", component: LabelsTable, columns: ["value", "label", "usage", "actions"], selected: 6, deleted: 7 },
  { name: "modifiers", component: ModifiersTable, columns: ["name", "category", "price", "status", "actions"], selected: 6, deleted: 4 },
  { name: "modifier-groups", component: ModifierGroupsTableLegacy, columns: ["name", "description", "selection", "modifiers", "status", "sort", "actions"], selected: 6, deleted: 4 },
  { name: "variations", component: VariationsTable, columns: ["variation", "description", "price", "default", "status", "actions"], selected: 8, deleted: 9 },
];

function seed(family: Family, rows = [row]) {
  harness.response = family.name === "allergens" ? { data: { allergens: rows, additives: [] } }
    : family.name === "labels" ? { data: { labels: rows } }
      : { data: rows, meta: { page: 1, limit: 10, total: rows.length, totalPages: 1 } };
  if (family.accumulated !== undefined) harness.state[family.accumulated] = rows;
  if (family.loaded !== undefined) harness.state[family.loaded] = true;
}

function run(family: Family) {
  harness.active = true;
  try {
    // React discards children/effects when a parent adjusts its own state during render.
    for (let attempt = 0; attempt < 10; attempt++) {
      harness.cursor = 0;
      harness.needsRender = false;
      const effectCount = harness.effects.length;
      const tree = family.component({});
      if (!harness.needsRender) return tree;
      harness.effects.length = effectCount;
    }
    throw new Error("Parent render did not settle");
  } finally { harness.active = false; }
}

function nodes(tree: ReactNode): Node[] {
  return Children.toArray(tree).flatMap((child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return [];
    return [child, ...nodes(child.props.children as ReactNode)];
  });
}

function view(tree: ReactNode) {
  const element = nodes(tree).find((node) => node.type === ResponsiveDataView);
  expect(element).toBeDefined();
  return element as ReactElement<ResponsiveDataViewProps<Row>>;
}

function actionNodes(tree: ReactNode): Node[] {
  return nodes(tree).flatMap((node) => {
    if (typeof node.type !== "function" || node.type.name !== "ActionDropdown") return [node];
    harness.active = true;
    try {
      const component = node.type as (props: Record<string, unknown>) => ReactNode;
      return nodes(component({ ...node.props, isOpen: true }));
    } finally { harness.active = false; }
  });
}

function clickAction(tree: ReactNode, action: "edit" | "delete" | "duplicate" | "branchOverride" | "manageModifiers" | "viewDetails" | "deactivate") {
  const match = actionNodes(tree).find((node) => {
    const label = node.props["aria-label"];
    return label === action || label === `${action}Aria` || Children.toArray(node.props.children as ReactNode).includes(action);
  });
  expect(match, `missing ${action} action`).toBeDefined();
  const handler = (match!.props.onClick ?? match!.props.onMouseDown) as (event: unknown) => void;
  handler({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.state = [];
  harness.effects = [];
  harness.restaurantId = "restaurant-1";
  harness.branchId = "branch-1";
  harness.isBranchAdmin = false;
  harness.isMobile = false;
  harness.isLoading = false;
  harness.isFetching = false;
  harness.isError = false;
  harness.isPending = false;
  harness.refetch.mockReset();
});

describe.each(families)("$name canonical list", (family) => {
  it("retains every column, one desktop table, and the same mobile record", () => {
    seed(family);
    const element = view(run(family));
    expect(element.props.columns.map((column) => column.id)).toEqual(family.columns);
    expect(element.props.data).toHaveLength(1);
    expect(element.props.rowKey(element.props.data[0])).toBe(family.name === "allergens" ? "allergens-A1" : family.name === "labels" ? row.value : row.id);
    const markup = renderToStaticMarkup(element);
    expect(markup.match(/<table\b/g)).toHaveLength(1);
    expect(markup).toContain('data-slot="responsive-data-view"');
    const identity = ["labels", "allergens"].includes(family.name) ? row.label : row.name;
    expect(markup.split(identity).length - 1).toBeGreaterThanOrEqual(2);
    expect(markup).toContain("md:hidden");
    expect(markup).toContain("hidden md:block");
  });

  it("uses canonical loading feedback in both layouts without stale actions", () => {
    seed(family, []);
    harness.isLoading = true;
    harness.isFetching = true;
    const markup = renderToStaticMarkup(view(run(family)));
    expect(markup).toContain('data-slot="data-table-skeleton"');
    expect(markup.match(/aria-label="Loading data"/g)).toHaveLength(2);
    expect(markup).not.toContain("editAria");
    expect(markup).not.toContain('data-state="empty"');
  });

  it("preserves cached rows during background refresh", () => {
    seed(family);
    harness.isFetching = true;
    const markup = renderToStaticMarkup(view(run(family)));
    expect(markup).not.toContain('data-slot="data-table-skeleton"');
    expect(markup).toContain("Fixture");
  });

  it.each([false, true])("reports a rejected network read, not empty/loading (cached=%s), and retries", async (cached) => {
    seed(family);
    const response = harness.response;
    if (!cached) harness.state = [];
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    let resolveRetry!: (value: unknown) => void;
    const network = vi.fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
    const observer = new QueryObserver(client, {
      queryKey: [family.name], queryFn: network, initialData: cached ? response : undefined,
    });
    const unsubscribe = observer.subscribe((result) => {
      harness.response = result.data;
      harness.isLoading = result.isLoading;
      harness.isFetching = result.isFetching;
      harness.isError = result.isError;
    });
    try {
      await observer.refetch({ cancelRefetch: false });
      expect(network).toHaveBeenCalledTimes(1);
      expect(harness.isError).toBe(true);
      if (!cached) expect(harness.response).toBeUndefined();
      const tree = run(family);
      const markup = renderToStaticMarkup(tree);
      expect(markup).toContain('data-state="error"');
      expect(markup).not.toContain('data-state="empty"');
      expect(markup).not.toContain('data-table-skeleton');
      expect(markup.includes("Fixture")).toBe(cached);
      if (cached) expect(view(tree).props.data).toHaveLength(1);
      const panel = nodes(tree).find((node) => node.type === StatePanel && node.props.state === "error")!;
      const retry = panel.props.action as ReactElement<{ disabled: boolean; onClick: () => void }>;
      expect(retry.props.disabled).toBe(false);
      let pending!: ReturnType<typeof observer.refetch>;
      harness.refetch.mockImplementation(() => { pending = observer.refetch(); return pending; });
      retry.props.onClick();
      expect(harness.refetch).toHaveBeenCalledTimes(1);
      expect(harness.isFetching).toBe(true);
      const retrying = run(family);
      for (const error of nodes(retrying).filter((node) => node.type === StatePanel && node.props.state === "error")) {
        expect((error.props.action as ReactElement<{ disabled: boolean }>).props.disabled).toBe(true);
      }
      if (cached) expect(renderToStaticMarkup(retrying)).toContain("Fixture");
      else expect(renderToStaticMarkup(retrying)).toContain('data-table-skeleton');
      resolveRetry(response);
      await pending;
      expect(harness.isError).toBe(false);
      // Accumulated lists normally copy successful query data in their effect.
      seed(family);
      expect(renderToStaticMarkup(run(family))).not.toContain('data-state="error"');
      expect(view(run(family)).props.data).toHaveLength(1);
    } finally { unsubscribe(); client.clear(); }
  });

  it("disables error retry while fetching, including a failed refresh of cached empty data", () => {
    seed(family, []);
    harness.isError = true;
    harness.isFetching = true;
    const tree = run(family);
    const panel = nodes(tree).find((node) => node.type === StatePanel && node.props.state === "error")!;
    expect((panel.props.action as ReactElement<{ disabled: boolean }>).props.disabled).toBe(true);
    const markup = renderToStaticMarkup(tree);
    expect(markup).not.toContain('data-state="empty"');
    expect(markup).not.toContain('data-table-skeleton');
  });

  it("renders canonical empty feedback and preserves pagination visibility", () => {
    seed(family, []);
    const markup = renderToStaticMarkup(run(family));
    expect(markup).toContain('data-state="empty"');
    expect(markup).toContain("emptyTitle");
    expect(markup.includes('data-slot="pagination-bar"')).toBe(!["items", "categories"].includes(family.name));
  });

  it.each(["desktop", "mobile"])("preserves %s edit selection and confirmed delete payload", (layout) => {
    seed(family);
    const element = view(run(family));
    const item = element.props.data[0];
    const actions = layout === "desktop"
      ? element.props.columns.find((column) => column.id === "actions")!.cell(item)
      : element.props.renderMobileItem(item);
    clickAction(actions, "edit");
    expect(harness.state[family.selected]).toEqual(item);
    clickAction(actions, "delete");
    expect(harness.mutate).not.toHaveBeenCalled();
    const confirmation = nodes(run(family)).find((node) => node.type === DeleteDialog)!;
    expect(confirmation.props.open).toBe(true);
    (confirmation.props.onConfirm as () => void)();
    const expected = family.name === "allergens" ? { type: "allergens", code: "A1", restaurantId: "restaurant-1" }
      : family.name === "labels" ? { value: row.value, restaurantId: "restaurant-1" } : row.id;
    expect(harness.mutate).toHaveBeenCalledWith(expected, expect.objectContaining({ onSuccess: expect.any(Function) }));
    harness.mutate.mock.lastCall![1].onSuccess();
    expect(harness.state[family.deleted]).toBeNull();
    expect(harness.refetch).toHaveBeenCalled();
  });
});

describe("catalog-specific parity", () => {
  describe.each(["categories", "items"])("%s accumulator identity", (name) => {
    it.each(["search", "status", "sort-or-category", "branch", "restaurant", "permission", "missing-restaurant"])("removes A before rendering a changed %s query B and after B fails", async (identity) => {
      const family = families.find((entry) => entry.name === name)!;
      seed(family);
      const responseA = harness.response;
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
      const network = vi.fn<() => Promise<unknown>>().mockRejectedValue(new TypeError("Failed to fetch B"));
      const observer = new QueryObserver(client, { queryKey: [name, "A"], initialData: responseA, queryFn: network, enabled: false });
      const unsubscribe = observer.subscribe((result) => {
        harness.response = result.data;
        harness.isLoading = result.isLoading;
        harness.isFetching = result.isFetching;
        harness.isError = result.isError;
      });
      try {
        expect(renderToStaticMarkup(run(family))).toContain(row.name);
        harness.state[name === "categories" ? 2 : 0] = 2;
        if (identity === "search") harness.state[name === "categories" ? 5 : 3] = "search B";
        if (identity === "status") harness.state[name === "categories" ? 0 : 4] = "inactive";
        if (identity === "sort-or-category") harness.state[name === "categories" ? 1 : 5] = name === "categories" ? "ASC" : "category-B";
        if (identity === "branch") harness.branchId = "branch-B";
        if (identity === "restaurant") harness.restaurantId = "restaurant-B";
        if (identity === "permission") harness.isBranchAdmin = true;
        if (identity === "missing-restaurant") harness.restaurantId = null;
        // Auth scope can change without changing the hook's query key. In that
        // case QueryObserver retains response A even after the request rejects.
        if (!["branch", "permission"].includes(identity)) observer.setOptions({ queryKey: [name, "B"], queryFn: network, enabled: false });
        const pending = observer.refetch();
        const loading = run(family);
        expect(renderToStaticMarkup(loading).includes(row.name)).toBe(false);
        expect(view(loading).props.data).toEqual([]);
        expect(harness.state[name === "categories" ? 2 : 0]).toBe(1);
        await pending;
        expect(harness.isError).toBe(true);
        harness.effects = [];
        const failed = run(family);
        const markup = renderToStaticMarkup(failed);
        expect(markup).toContain('data-state="error"');
        expect(markup.includes(row.name)).toBe(false);
        expect(nodes(failed).some((node) => node.type === ResponsiveDataView)).toBe(false);
        expect(harness.state[family.accumulated!]).toEqual([]);
        expect(harness.state[family.loaded!]).toBe(false);
        expect(harness.mutate).not.toHaveBeenCalled();
      } finally { unsubscribe(); client.clear(); }
    });

    it("keeps accumulated A actionable on a same-identity refresh failure", async () => {
      const family = families.find((entry) => entry.name === name)!;
      const rows = [row, { ...row, id: "row-2", name: "Second page A" }];
      seed(family, rows);
      const first = view(run(family));
      harness.isFetching = true;
      expect(view(run(family)).props.data).toEqual(rows);
      harness.isFetching = false;
      harness.isError = true;
      const failed = view(run(family));
      expect(failed.props.data).toEqual(rows);
      expect(failed.props.columns.map((column) => column.id)).toEqual(first.props.columns.map((column) => column.id));
      clickAction(failed.props.columns.find((column) => column.id === "actions")!.cell(row), "edit");
      expect(harness.state[family.selected]).toEqual(row);
    });
  });

  it.each(["categories", "items"])("preserves accumulated %s rows when mutation refresh returns to page one and fails", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    const second = { ...row, id: "row-2", name: "Second page" };
    seed(family, [row, second]);
    harness.state[name === "categories" ? 2 : 0] = 2;
    const tree = run(family);
    const modal = nodes(tree).find((node) => typeof node.props.onSuccess === "function")!;
    expect(modal).toBeDefined();
    (modal.props.onSuccess as () => void)();
    expect(harness.state[name === "categories" ? 2 : 0]).toBe(1);
    expect(harness.state[family.accumulated!]).toEqual([row, second]);

    // The page-one cache must not overwrite accumulated pages while its refresh
    // is in flight or rejected. Only a settled successful read replaces rows.
    const cachedPageOne = [row];
    harness.response = { data: cachedPageOne, meta: { page: 1, total: 2 } };
    for (const [isFetching, isError] of [[true, false], [false, true], [false, false]]) {
      harness.isFetching = isFetching;
      harness.isError = isError;
      harness.effects = [];
      run(family);
      const sync = harness.effects.find((entry) => entry.deps?.[0] === cachedPageOne)!;
      expect(sync).toBeDefined();
      sync.effect();
      expect(harness.state[family.accumulated!]).toEqual(isFetching || isError ? [row, second] : [row]);
    }
  });

  it.each(["categories", "items"])("does not skip a failed %s load-more page and retries that query", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    const pageIndex = name === "categories" ? 2 : 0;
    harness.state[pageIndex] = 2;
    harness.response = undefined;
    harness.isError = true;
    harness.scroll.mockClear();
    const tree = run(family);
    expect(view(tree).props.data).toEqual([row]);
    expect(harness.scroll.mock.calls.every(([options]) => options.enabled === false)).toBe(true);
    expect(view(tree).props.footer).toBeNull();
    const panel = nodes(tree).find((node) => node.type === StatePanel && node.props.state === "error")!;
    (panel.props.action as ReactElement<{ onClick: () => void }>).props.onClick();
    expect(harness.refetch).toHaveBeenCalledTimes(1);
    expect(harness.state[pageIndex]).toBe(2);
  });

  it.each(["labels", "variations"])("supplies the %s count translation's visible parameter", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    const markup = renderToStaticMarkup(run(family));
    expect(markup).toContain("showingCount:{&quot;visible&quot;:1,&quot;total&quot;:1}");
    expect(markup).not.toContain("&quot;shown&quot;");
  });

  it.each([false, true])("opens only the visible modifier dropdown and uses portalled content (mobile=%s)", (mobile) => {
    const family = families[4];
    seed(family);
    harness.isMobile = mobile;
    harness.state[9] = row.id;
    const element = view(run(family));
    const dropdowns = [element.props.columns.find((column) => column.id === "actions")!.cell(row), element.props.renderMobileItem(row)]
      .map((content) => nodes(content).find((node) => typeof node.type === "function" && node.type.name === "ActionDropdown")!);
    expect(dropdowns.map((node) => node.props.isOpen)).toEqual([!mobile, mobile]);
    const selected = dropdowns[mobile ? 1 : 0];
    harness.active = true;
    let content: ReactNode;
    try { content = (selected.type as (props: Record<string, unknown>) => ReactNode)(selected.props); }
    finally { harness.active = false; }
    const root = nodes(content).find((node) => typeof node.props.onOpenChange === "function")!;
    expect(root.props.modal).toBe(false);
    expect(nodes(content).some((node) => typeof node.type === "function" && node.type.name === "DropdownMenuContent")).toBe(true);
    (root.props.onOpenChange as (open: boolean) => void)(false);
    expect(harness.state[9]).toBeNull();
  });

  it.each([
    ["categories", { page: 1, limit: 10, search: undefined, restaurantId: "restaurant-1", sortOrder: "DESC", includeInactive: true, inactive: undefined }],
    ["modifiers", { page: 1, limit: 10, search: undefined, restaurantId: "restaurant-1", categoryId: undefined }],
    ["modifier-groups", { page: 1, limit: 10, search: undefined, restaurantId: "restaurant-1" }],
    ["labels", { restaurantId: "restaurant-1" }],
    ["allergens", { restaurantId: "restaurant-1" }],
  ])("keeps the %s default query contract", (name, expected) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    run(family);
    expect(harness.query).toHaveBeenLastCalledWith(expected);
  });

  it.each(["allergens", "labels", "modifiers", "modifier-groups", "variations"])("keeps one %s pagination control wired to page state", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    const tree = run(family);
    const element = view(tree);
    const pagination = [...nodes(tree), ...nodes(element.props.footer)].filter((node) => typeof node.props.onPageChange === "function");
    expect(pagination).toHaveLength(1);
    (pagination[0].props.onPageChange as (page: number) => void)(2);
    expect(harness.state[0]).toBe(2);
    expect(renderToStaticMarkup(tree).match(/data-slot="pagination-bar"/g)).toHaveLength(1);
  });

  it.each([null, "", "invalid", 0, "12.50"])("keeps item price %s and branch-zero overrides consistent in both layouts", (price) => {
    const family = families[2];
    seed(family, [{ ...row, price } as Row]);
    let element = view(run(family));
    const displayed = (value: ReactElement<ResponsiveDataViewProps<Row>>) => [
      renderToStaticMarkup(value.props.columns.find((column) => column.id === "price")!.cell(value.props.data[0])),
      renderToStaticMarkup(value.props.renderMobileItem(value.props.data[0])),
    ];
    for (const markup of displayed(element)) {
      expect(markup.includes("variationBased")).toBe(price === null || price === "" || price === "invalid");
    }
    seed(family, [{ ...row, price, branchOverride: { price: 0 } } as Row]);
    element = view(run(family));
    const [desktop, mobile] = displayed(element);
    expect(desktop).not.toContain("variationBased");
    expect(mobile).not.toContain("variationBased");
    const priceText = desktop.replace(/<[^>]*>/g, "");
    expect(mobile).toContain(priceText);
  });

  it.each(["items", "categories"])("preserves %s branch scope, status override, and allowed actions", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family, [{ ...row, branchOverride: { isAvailable: false, price: 0 } } as Row]);
    harness.isBranchAdmin = true;
    const element = view(run(family));
    for (const layout of ["desktop", "mobile"]) {
      const item = element.props.data[0];
      const actions = layout === "desktop" ? element.props.columns.find((column) => column.id === "actions")!.cell(item) : element.props.renderMobileItem(item);
      const labels = actionNodes(actions).flatMap((node) => Children.toArray(node.props.children as ReactNode));
      expect(labels).not.toContain("edit");
      expect(labels).not.toContain("delete");
      expect(labels).not.toContain("duplicate");
      clickAction(actions, "branchOverride");
    }
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain("inactive");
    expect(markup).toContain('draggable="false"');
    expect(harness.query).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: "restaurant-1" }));
    expect(harness.state[name === "items" ? 13 : 12]).toEqual(element.props.data[0]);
  });

  it.each(["items", "modifiers"])("preserves %s duplicate action and pending guard in both layouts", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    for (const pending of [false, true]) {
      harness.isPending = pending;
      const element = view(run(family));
      for (const content of [element.props.columns.find((column) => column.id === "actions")!.cell(row), element.props.renderMobileItem(row)]) {
        const duplicate = actionNodes(content).find((node) => Children.toArray(node.props.children as ReactNode).includes(pending ? "duplicating" : "duplicate"))!;
        expect(duplicate.props.disabled).toBe(pending);
        harness.mutate.mockClear();
        (duplicate.props.onMouseDown as (event: unknown) => void)({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
        expect(harness.mutate).toHaveBeenCalledTimes(pending ? 0 : 1);
        if (!pending) expect(harness.mutate.mock.lastCall![0]).toBe(row.id);
      }
    }
  });

  it("keeps group management and selection/count/sort values in both layouts", () => {
    const family = families[5];
    seed(family);
    const element = view(run(family));
    for (const content of [element.props.columns.find((column) => column.id === "actions")!.cell(row), element.props.renderMobileItem(row)]) {
      clickAction(content, "manageModifiers");
      expect(harness.state[7]).toEqual(row);
    }
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain("1/3");
    expect(markup).toContain("modifiersCount");
    expect(markup).toContain("sort");
  });

  it.each(["allergens", "labels"])("keeps %s mutation controls disabled without restaurant context", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family);
    harness.restaurantId = null;
    const tree = run(family);
    expect(renderToStaticMarkup(tree)).toContain('data-state="permission"');
    const element = view(tree);
    for (const content of [element.props.columns.find((column) => column.id === "actions")!.cell(row), element.props.renderMobileItem(row)]) {
      const actions = actionNodes(content).filter((node) => node.type === "button");
      expect(actions.length).toBeGreaterThanOrEqual(2);
      expect(actions.every((node) => node.props.disabled === true)).toBe(true);
    }
  });

  it("preserves item query flags and responsive observer gating", () => {
    const family = families[2];
    seed(family);
    harness.state[4] = "inactive";
    harness.state[5] = "category-2";
    harness.state[3] = "pizza";
    harness.response = { data: [row], meta: { total: 20, totalPages: 2 } };
    for (const mobile of [false, true]) {
      harness.isMobile = mobile;
      harness.scroll.mockClear();
      run(family);
      expect(harness.query).toHaveBeenLastCalledWith({ page: 1, limit: 10, restaurantId: "restaurant-1", search: "pizza", categoryId: "category-2", inactive: true, sortBy: "sortOrder", sortOrder: "ASC" });
      expect(harness.scroll.mock.calls.map(([options]) => options.enabled)).toEqual([!mobile, mobile]);
    }
  });

  it.each(["active", "inactive", "all"])("keeps variation %s query flags unchanged", (status) => {
    const family = families[6];
    seed(family);
    harness.state[6] = status;
    run(family);
    const flags = status === "all" ? { all: true, includeInactive: true } : status === "inactive" ? { inactive: true } : { isActive: true };
    expect(harness.query).toHaveBeenLastCalledWith({ page: 1, limit: 10, restaurantId: "restaurant-1", search: undefined, sortBy: "createdAt", sortOrder: "DESC", ...flags });
  });

  it.each(["allergens", "labels"])("keeps %s local filtering, sorting, and page size", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    seed(family, Array.from({ length: 12 }, (_, index) => ({ ...row, code: `A${index}`, value: `value-${index}`, label: `Label ${String(index).padStart(2, "0")}` })));
    expect(view(run(family)).props.data).toHaveLength(10);
    harness.state[0] = 2;
    expect(view(run(family)).props.data).toHaveLength(2);
    harness.state[0] = 1;
    harness.state[2] = "Label 11";
    expect(view(run(family)).props.data.map((item) => item.label)).toEqual(["Label 11"]);
  });

  it.each(["allergens", "categories", "items"])("keeps whole-row %s drag/drop wired through canonical rows", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    const second = { ...row, id: "row-2", code: "A2", label: "Second" };
    seed(family, [row, second]);
    const tree = run(family);
    const element = view(tree);
    const order = element.props.columns.find((column) => column.id === "order")!.cell(row);
    const marker = nodes(order).find((node) => node.props.ref)!;
    const desktopRow = { draggable: false };
    (marker.props.ref as (node: unknown) => void)({ closest: () => desktopRow });
    expect(desktopRow.draggable).toBe(true);
    const wrapper = nodes(tree).find((node) => node.props.onDragStart)!;
    (wrapper.props.onDragStart as (event: unknown) => void)({ target: { closest: () => ({ sectionRowIndex: 0 }) } });
    const updated = run(family);
    const updatedWrapper = nodes(updated).find((node) => node.props.onDrop)!;
    vi.useFakeTimers();
    try {
      (updatedWrapper.props.onDrop as (event: unknown) => void)({ target: { closest: () => ({ sectionRowIndex: 1 }) } });
      vi.runAllTimers();
      expect((harness.state[6] as Row[]).map((item) => item.code)).toEqual(["A2", "A1"]);
      expect(harness.mutate).toHaveBeenCalledTimes(1);
      const payload = harness.mutate.mock.lastCall![0];
      expect(name === "allergens" ? payload.allergens.map((item: Row) => item.code) : payload.items.map((item: Row) => item.id)).toEqual(name === "allergens" ? ["A2", "A1"] : ["row-2", "row-1"]);
    } finally { vi.useRealTimers(); }
  });

  it.each(["allergens", "categories", "items"])("keeps %s mobile drag/drop and desktop permission gating", (name) => {
    const family = families.find((entry) => entry.name === name)!;
    const second = { ...row, id: "row-2", code: "A2", label: "Second" };
    seed(family, [row, second]);
    let element = view(run(family));
    const card = nodes(element.props.renderMobileItem(row)).find((node) => node.props.onDragStart)!;
    expect(card.props.draggable).toBe(true);
    (card.props.onDragStart as () => void)();
    element = view(run(family));
    const target = nodes(element.props.renderMobileItem(second)).find((node) => node.props.onDrop)!;
    vi.useFakeTimers();
    try {
      (target.props.onDrop as () => void)();
      vi.runAllTimers();
      expect((harness.state[6] as Row[]).map((item) => item.code)).toEqual(["A2", "A1"]);
    } finally { vi.useRealTimers(); }

    if (name === "allergens") harness.restaurantId = null;
    else harness.isBranchAdmin = true;
    element = view(run(family));
    const marker = nodes(element.props.columns.find((column) => column.id === "order")!.cell(row)).find((node) => node.props.ref)!;
    const desktopRow = { draggable: true };
    (marker.props.ref as (node: unknown) => void)({ closest: () => desktopRow });
    expect(desktopRow.draggable).toBe(false);
    expect(nodes(element.props.renderMobileItem(row)).find((node) => "draggable" in node.props)!.props.draggable).toBe(false);
  });

  it.each(["keyboard", "mobile"])("preserves allergen %s movement and reorder failure rollback", (input) => {
    const family = families[0];
    const second = { ...row, code: "A2", label: "Second" };
    seed(family, [row, second]);
    const element = view(run(family));
    if (input === "keyboard") {
      const handle = nodes(element.props.columns[0].cell(row)).find((node) => node.props.onKeyDown)!;
      (handle.props.onKeyDown as (event: unknown) => void)({ key: "ArrowDown", preventDefault: vi.fn() });
    } else {
      const down = nodes(element.props.renderMobileItem(row)).find((node) => String(node.props["aria-label"]).startsWith("moveDownAria"))!;
      (down.props.onClick as () => void)();
    }
    expect((harness.state[6] as Row[]).map((item) => item.code)).toEqual(["A2", "A1"]);
    harness.mutate.mock.lastCall![1].onError();
    expect((harness.state[6] as Row[]).map((item) => item.code)).toEqual(["A1", "A2"]);
  });

  it.each(["search", "sort", "pending"])("preserves allergen reorder restrictions during %s", (mode) => {
    const family = families[0];
    seed(family);
    if (mode === "search") harness.state[2] = "Fixture";
    if (mode === "sort") harness.state[4] = "label";
    if (mode === "pending") harness.isPending = true;
    const element = view(run(family));
    const handle = nodes(element.props.columns[0].cell(row)).find((node) => node.props.onKeyDown)!;
    expect(handle.props.disabled).toBe(true);
    const mobileMoves = nodes(element.props.renderMobileItem(row)).filter((node) => String(node.props["aria-label"]).startsWith("move"));
    expect(mobileMoves.every((node) => node.props.disabled === true)).toBe(true);
  });
});
