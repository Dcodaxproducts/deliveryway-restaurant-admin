import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResponsiveDataView, type ResponsiveDataViewProps } from "@/components/common/ResponsiveDataView";
import { SectionCard } from "@/components/common/SectionCard";
import { StatePanel } from "@/components/common/EmptyState";
import PaginationSection from "@/components/common/PaginationSection";
import AdminDealsTable from "../deals/components/AdminDealsTable";
import ModifierCategoriesTable from "../modifier-categories/components/ModifierCategoriesTable";
import ModifierCategoryFilters from "../modifier-categories/components/ModifierCategoryFilters";
import ModifierCategoryFormDialog from "../modifier-categories/components/ModifierCategoryFormDialog";
import ModifierCategoryDeleteDialog from "../modifier-categories/components/ModifierCategoryDeleteDialog";
import MenusListingPage from "./MenusListingPage";
import Header from "../legacy/root-menu-components/listing/header";
import Categories from "../legacy/root-menu-components/listing/categories";
import ItemList from "../legacy/root-menu-components/listing/itemList";
import MenuItemCard from "@/components/cards/MenuItemCard";
import CreateMenuItemModal from "../legacy/root-menu-components/CreateMenuItemModal/CreateMenuItemModal";
import type { AdminDeal } from "@/types/admin-deals";
import type { ModifierCategory } from "@/types/modifier-categories";

const harness = vi.hoisted(() => ({
  active: false, cursor: 0, state: [] as unknown[], effects: [] as (() => void | (() => void))[],
  restaurantId: "restaurant-1" as string | null, branchAdmin: false,
  pathname: "/menu/listing", menuId: "menu-1" as string | null,
  categories: undefined as unknown, menu: undefined as unknown, items: undefined as unknown,
  loading: false, fetching: false, error: false, menuLoading: false, menuError: false, pending: false,
  query: vi.fn(), menuQuery: vi.fn(), itemsQuery: vi.fn(), refetch: vi.fn(), mutate: vi.fn(), navigate: vi.fn(), currency: vi.fn(),
}));

// Drive only the component under test's state. The canonical UI renders through
// React SSR, so its table/feedback semantics are checked without replacing it.
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
      if (harness.active) harness.effects.push(effect);
      else react.useEffect(effect, deps);
    },
    useRef: <T,>(value: T) => harness.active ? { current: value } : react.useRef(value),
  };
});
vi.mock("next-intl", () => ({ useTranslations: () => (key: string, values?: Record<string, unknown>) => values ? `${key}:${JSON.stringify(values)}` : key }));
vi.mock("next/navigation", () => ({
  usePathname: () => harness.pathname,
  useSearchParams: () => ({ get: () => harness.menuId }),
  useRouter: () => ({ push: harness.navigate }),
}));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ restaurantId: harness.restaurantId, user: { restaurantId: harness.restaurantId }, isBranchAdmin: harness.branchAdmin }) }));
vi.mock("@/hooks/useCurrency", () => ({ useCurrency: (id: unknown) => {
  harness.currency(id);
  return { resolveCurrency: (currency: string | null) => currency || "EUR", formatMoney: (value: unknown) => `money:${value}` };
} }));
vi.mock("@/hooks/useModifierCategories", () => ({
  useModifierCategories: (params: unknown) => {
    harness.query(params);
    return { data: harness.categories, isLoading: harness.loading, isFetching: harness.fetching, isError: harness.error, refetch: harness.refetch };
  },
  useDeleteModifierCategory: () => ({ mutate: harness.mutate, isPending: harness.pending }),
}));
vi.mock("@/hooks/useMenus", () => ({
  useGetMenuById: (id: unknown) => {
    harness.menuQuery(id);
    return { data: harness.menu, isLoading: harness.menuLoading, isError: harness.menuError };
  },
  useGetMenuItems: (params: unknown) => {
    harness.itemsQuery(params);
    return { data: harness.items, isLoading: harness.loading, isFetching: harness.fetching, isError: harness.error, refetch: harness.refetch };
  },
}));
vi.mock("../modifier-categories/components/ModifierCategoryFormDialog", () => ({ default: () => null }));
vi.mock("../modifier-categories/components/ModifierCategoryDeleteDialog", () => ({ default: () => null }));
vi.mock("../legacy/root-menu-components/listing/categories", () => ({ default: () => null }));
vi.mock("../legacy/root-menu-components/CreateMenuItemModal/CreateMenuItemModal", () => ({ default: () => null }));
vi.mock("@/components/cards/MenuItemCard", () => ({ default: ({ item }: { item: { name: string } }) => <article>{item.name}</article> }));

type Node = ReactElement<Record<string, unknown>>;
function nodes(tree: ReactNode): Node[] {
  return Children.toArray(tree).flatMap((child) => isValidElement<Record<string, unknown>>(child)
    ? [child, ...nodes(child.props.children as ReactNode)] : []);
}
function element<P>(tree: ReactNode, type: unknown): ReactElement<P> {
  const result = nodes(tree).find((node) => node.type === type);
  expect(result).toBeDefined();
  return result as ReactElement<P>;
}
function run(render: () => ReactNode) {
  harness.cursor = 0;
  harness.effects = [];
  harness.active = true;
  try { return render(); } finally { harness.active = false; }
}
function view<T>(tree: ReactNode) {
  return element<ResponsiveDataViewProps<T>>(tree, ResponsiveDataView);
}
function click(tree: ReactNode, label: string) {
  const node = nodes(tree).find((node) => node.props["aria-label"] === label || node.props.label === label || Children.toArray(node.props.children as ReactNode).includes(label));
  expect(node, `missing action: ${label}`).toBeDefined();
  (node!.props.onClick as () => void)();
}

const deal: AdminDeal = {
  id: "deal-1", title: "Lunch special", description: "Lunch description", code: "LUNCH", restaurantId: "restaurant-1",
  currency: "EUR", discountValue: 12.5, dealSelectionMode: "FIXED_ITEMS", dealRequiredQuantity: 2,
  scopeMenuItemIds: ["item-1"], scopeCategoryIds: [], isActive: true, lifecycle: "scheduled",
  startsAt: "2026-09-01T10:00:00Z", expiresAt: "2026-09-30T22:00:00Z", branchId: "branch-1",
};
const category: ModifierCategory = { id: "category-1", name: "Toppings", slug: "toppings", description: "Extra toppings", sortOrder: 4, isActive: true };
const item = {
  id: "item-1", name: "Margherita", basePrice: 5, depositAmount: 2, category: { id: "category-1", name: "Pizza" },
  variations: [{ id: "variation-1", name: "Large", price: 12, isDefault: true }],
  modifiers: [{ id: "modifier-1", name: "Olives", priceDelta: 3 }], isActive: true,
};
const menu = {
  id: "menu-1", name: "Evening menu", description: "Dinner service", restaurantId: "restaurant-1", slug: "evening",
  isActive: true, isTimed: true, sortOrder: 4, createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-02T10:00:00Z",
  timingConfig: { timezone: "Europe/Berlin", windows: [{ day: "MONDAY", start: "18:00", end: "22:00" }] },
  categories: [{ id: "link-1", menuCategory: { id: "category-1", name: "Pizza", slug: "pizza" } }],
  items: [{ id: "link-item-1", menuItem: item }, { id: "broken-link", menuItem: null }],
};

beforeEach(() => {
  vi.clearAllMocks();
  harness.state = [];
  harness.restaurantId = "restaurant-1";
  harness.branchAdmin = false;
  harness.pathname = "/menu/listing";
  harness.menuId = "menu-1";
  harness.loading = harness.fetching = harness.error = harness.menuLoading = harness.menuError = harness.pending = false;
  harness.categories = { data: [category], meta: { page: 1, limit: 10, total: 21, totalPages: 3, hasNext: true, hasPrevious: false } };
  harness.menu = { data: menu };
  harness.items = { data: [{ id: "fallback", name: "Fallback item" }] };
});
afterEach(() => vi.useRealTimers());

describe("deals presentation", () => {
  const props = { deals: [deal, { ...deal, id: "deal-2" }], loading: false, error: null, onDelete: vi.fn(), onStats: vi.fn(), onReorder: vi.fn() };
  const render = (overrides: Partial<ComponentProps<typeof AdminDealsTable>> = {}) => run(() => AdminDealsTable({ ...props, ...overrides }));

  it("retains all columns, record fields and responsive layouts", () => {
    const result = view<AdminDeal>(render());
    expect(result.props.columns.map((column) => column.id)).toEqual(["order", "deal", "type", "price", "scope", "schedule", "quantity", "status", "actions"]);
    expect(result.props.rowKey(deal)).toBe(deal.id);
    expect(harness.currency).toHaveBeenCalledWith("restaurant-1");
    const markup = renderToStaticMarkup(result);
    expect(markup.match(/<table\b/g)).toHaveLength(1);
    expect(markup).toContain("hidden md:block");
    expect(markup).toContain("md:hidden");
    for (const text of ["Lunch special", "Lunch description", "LUNCH", "12.50", "scheduled", "branch-1"]) expect(markup).toContain(text);
    expect(result.props.columns.find((column) => column.id === "schedule")!.cell(deal)).toBeDefined();
  });

  it.each(["loading", "empty", "error"] as const)("renders canonical %s feedback without record actions", (state) => {
    const markup = renderToStaticMarkup(render({ deals: state === "empty" ? [] : [deal], loading: state === "loading", error: state === "error" ? new Error("private backend detail") : null }));
    expect(markup).toContain(state === "loading" ? 'data-slot="data-table-skeleton"' : `data-state="${state}"`);
    expect(markup).not.toContain('aria-label="viewStats"');
    expect(markup).not.toContain("private backend detail");
  });

  it("keeps loading ahead of an error", () => {
    const markup = renderToStaticMarkup(render({ loading: true, error: new Error("failure") }));
    expect(markup).toContain('data-slot="data-table-skeleton"');
    expect(markup).not.toContain('data-state="error"');
  });

  it.each(["desktop", "mobile"])("preserves stats, edit and delete on %s", (layout) => {
    const result = view<AdminDeal>(render());
    const content = layout === "mobile" ? result.props.renderMobileItem(deal) : result.props.columns.find((column) => column.id === "actions")!.cell(deal);
    click(content, "viewStats"); click(content, "edit"); click(content, "delete");
    expect(props.onStats).toHaveBeenCalledWith(deal);
    expect(props.onDelete).toHaveBeenCalledWith(deal);
    expect(harness.navigate).toHaveBeenCalledWith("/menu/deals/deal-1/edit");
  });

  it("retains desktop row drag/drop and clears same-row and ended drags", () => {
    const dragEvent = (index: number) => ({ target: { closest: () => ({ sectionRowIndex: index }) }, preventDefault: vi.fn() });
    const first = render() as Node;
    const result = view<AdminDeal>(first);
    const order = result.props.columns[0].cell(deal) as Node;
    const row = { draggable: false };
    (order.props.ref as (node: unknown) => void)({ closest: () => row });
    expect(row.draggable).toBe(true);
    (first.props.onDragStart as (event: unknown) => void)(dragEvent(0));
    expect(harness.state[0]).toBe(deal.id);
    const event = dragEvent(1);
    ((render() as Node).props.onDragOver as (event: unknown) => void)(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    ((render() as Node).props.onDrop as (event: unknown) => void)(event);
    expect(props.onReorder).toHaveBeenCalledExactlyOnceWith("deal-1", "deal-2");
    expect(harness.state[0]).toBeNull();
    props.onReorder.mockClear();
    (first.props.onDragStart as (event: unknown) => void)(dragEvent(0));
    ((render() as Node).props.onDrop as (event: unknown) => void)(dragEvent(0));
    expect(props.onReorder).not.toHaveBeenCalled();
    (first.props.onDragStart as (event: unknown) => void)(dragEvent(0));
    ((render() as Node).props.onDragEnd as () => void)();
    expect(harness.state[0]).toBeNull();
  });

  it("keeps mobile reorder single-fired when events bubble", () => {
    let result = view<AdminDeal>(render());
    ((result.props.renderMobileItem(deal) as Node).props.onDragStart as () => void)();
    const tree = render() as Node;
    result = view<AdminDeal>(tree);
    ((result.props.renderMobileItem(props.deals[1]) as Node).props.onDrop as () => void)();
    (tree.props.onDrop as (event: unknown) => void)({ target: { closest: () => null } });
    expect(props.onReorder).toHaveBeenCalledExactlyOnceWith("deal-1", "deal-2");
    expect(harness.state[0]).toBeNull();
  });

  it.each([{ reordering: true }, { onReorder: undefined }])("preserves non-draggable rows/cards for %j", (overrides) => {
    const result = view<AdminDeal>(render(overrides));
    const row = { draggable: true };
    ((result.props.columns[0].cell(deal) as Node).props.ref as (node: unknown) => void)({ closest: () => row });
    expect(row.draggable).toBe(false);
    expect((result.props.renderMobileItem(deal) as Node).props.draggable).toBe(false);
  });
});

describe("modifier categories presentation", () => {
  const render = () => run(ModifierCategoriesTable);
  const dialog = () => element<ComponentProps<typeof ModifierCategoryDeleteDialog>>(render(), ModifierCategoryDeleteDialog).props;

  it("preserves query scope, columns and one pagination footer", () => {
    const result = view<ModifierCategory>(render());
    expect(harness.query).toHaveBeenLastCalledWith({ restaurantId: "restaurant-1", page: 1, limit: 10, search: undefined, inactive: undefined });
    expect(result.props.columns.map((column) => column.id)).toEqual(["name", "slug", "description", "sort", "status", "actions"]);
    const markup = renderToStaticMarkup(result);
    expect(markup.match(/<table\b/g)).toHaveLength(1);
    expect(markup.match(/Toppings/g)).toHaveLength(2);
    const pagination = element<ComponentProps<typeof PaginationSection>>(result.props.footer, PaginationSection).props;
    expect(pagination).toMatchObject({ page: 1, totalPages: 3, total: 21, limit: 10, hasNext: true, hasPrevious: false });
    expect(pagination.onPageChange).toBeDefined();
    pagination.onPageChange!(2);
    render();
    expect(harness.query).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it.each(["loading", "fetching", "error", "empty"] as const)("renders %s honestly", (state) => {
    if (state === "empty") harness.categories = { data: [] };
    else harness[state] = true;
    const result = view<ModifierCategory>(render());
    const markup = renderToStaticMarkup(result);
    expect(markup).toContain(["loading", "fetching"].includes(state) ? 'data-slot="data-table-skeleton"' : `data-state="${state}"`);
    expect(markup).not.toContain('aria-label="editModifierCategory"');
    expect(result.props.footer).toBeDefined();
    if (state === "error") expect(markup).not.toContain('data-state="empty"');
  });

  it("retains the 500ms trimmed search debounce and page reset", () => {
    vi.useFakeTimers();
    harness.state = [3, 10, "  cheese  ", "", false];
    render();
    const cleanup = harness.effects[0]();
    vi.advanceTimersByTime(499);
    expect(harness.state[0]).toBe(3);
    expect(harness.state[3]).toBe("");
    vi.advanceTimersByTime(1);
    render();
    expect(harness.query).toHaveBeenLastCalledWith(expect.objectContaining({ search: "cheese", page: 1 }));
    cleanup?.();
  });

  it("preserves filter callbacks and missing restaurant handling", () => {
    harness.restaurantId = null;
    harness.state[0] = 3;
    const filters = element<ComponentProps<typeof ModifierCategoryFilters>>(render(), ModifierCategoryFilters).props;
    expect(filters.disabled).toBe(true);
    filters.onSearchChange("new search");
    filters.onInactiveChange(true);
    filters.onSearch();
    expect(harness.state[2]).toBe("new search");
    expect(harness.refetch).toHaveBeenCalledOnce();
    render();
    expect(harness.query).toHaveBeenLastCalledWith(expect.objectContaining({ restaurantId: undefined, inactive: true, page: 1 }));
  });

  it.each(["desktop", "mobile"])("preserves edit/delete targets on %s", (layout) => {
    const result = view<ModifierCategory>(render());
    const content = layout === "mobile" ? result.props.renderMobileItem(category) : result.props.columns.find((column) => column.id === "actions")!.cell(category);
    click(content, "editModifierCategory");
    const form = element<ComponentProps<typeof ModifierCategoryFormDialog>>(render(), ModifierCategoryFormDialog).props;
    expect(form).toMatchObject({ open: true, initialData: category, restaurantId: "restaurant-1" });
    form.onOpenChange(false);
    click(content, "deleteModifierCategory");
    expect(dialog()).toMatchObject({ open: true, category, errorMessage: "" });
  });

  it("preserves create, deletion failure, success refetch and cancellation", () => {
    click(render(), "addCategory");
    expect(element<ComponentProps<typeof ModifierCategoryFormDialog>>(render(), ModifierCategoryFormDialog).props).toMatchObject({ open: true, initialData: null });
    dialog().onConfirm();
    expect(harness.mutate).not.toHaveBeenCalled();
    harness.state[7] = category;
    dialog().onConfirm();
    expect(harness.mutate).toHaveBeenCalledWith(category.id, expect.any(Object));
    const callbacks = harness.mutate.mock.calls[0][1];
    callbacks.onError(new Error("Cannot delete"));
    expect(dialog()).toMatchObject({ open: true, category, errorMessage: "Cannot delete" });
    harness.pending = true;
    expect(dialog().isLoading).toBe(true);
    callbacks.onSuccess();
    expect(dialog().open).toBe(false);
    expect(harness.refetch).toHaveBeenCalledOnce();
    harness.state[7] = category;
    dialog().onOpenChange(false);
    expect(dialog()).toMatchObject({ open: false, errorMessage: "" });
  });
});

describe("menu listing presentation", () => {
  const render = () => run(MenusListingPage);
  const list = (tree = render()) => element<ComponentProps<typeof ItemList>>(tree, ItemList).props;

  it("uses canonical page/header/sections and preserves detail metadata/prices", () => {
    const markup = renderToStaticMarkup(render());
    expect(markup).toContain('data-slot="page-layout"');
    expect(markup).toContain('data-slot="page-header"');
    expect(markup).toContain('data-slot="section-card"');
    for (const value of ["Evening menu", "Dinner service", "Europe/Berlin", "18:00", "22:00", "money:12", "money:2", "Olives", "money:3"]) expect(markup).toContain(value);
    expect(markup).not.toContain("bg-gradient-to-br");
    expect(list().items).toEqual([item]);
    expect(harness.menuQuery).toHaveBeenCalledWith("menu-1");
    expect(harness.itemsQuery).toHaveBeenCalledWith({ restaurantId: "restaurant-1", menuId: "menu-1", categoryId: undefined });
  });

  it("preserves manage toggle and category filtering with fallback precedence", () => {
    let tree = render();
    element<ComponentProps<typeof Header>>(tree, Header).props.onManageClick();
    tree = render();
    expect(element<ComponentProps<typeof Header>>(tree, Header).props.editing).toBe(true);
    let categories = element<ComponentProps<typeof Categories>>(tree, Categories).props;
    expect(categories.editing).toBe(true);
    categories.onSelectCategory("category-1");
    expect(list().items).toEqual([item]);
    categories = element<ComponentProps<typeof Categories>>(render(), Categories).props;
    categories.onSelectCategory("other-category");
    expect(list().items).toEqual([{ id: "fallback", name: "Fallback item" }]);
    expect(harness.itemsQuery).toHaveBeenLastCalledWith(expect.objectContaining({ categoryId: "other-category" }));
    element<ComponentProps<typeof Header>>(render(), Header).props.onManageClick();
    expect(list().editing).toBe(false);
  });

  it.each(["missing-id", "missing-data", "error", "cached-error"])("does not claim empty attachments for %s", (state) => {
    if (state === "missing-id") harness.menuId = null;
    if (state !== "cached-error") harness.menu = undefined;
    harness.menuError = state.includes("error");
    const markup = renderToStaticMarkup(render());
    expect(markup.match(/data-state="unavailable"/g)).toHaveLength(3);
    expect(markup).not.toContain("noAttachedCategories");
    expect(markup).not.toContain("noAttachedItems");
    expect(markup).not.toContain("itemsCount");
    expect(list().refetch).toBe(harness.refetch);
    if (state === "missing-id") expect(harness.menuQuery).toHaveBeenCalledWith(undefined);
  });

  it("distinguishes successful empty attachments from unavailable data", () => {
    harness.menu = { data: { ...menu, items: [], categories: [] } };
    const markup = renderToStaticMarkup(render());
    expect(markup).toContain("noAttachedCategories");
    expect(markup).toContain("noAttachedItems");
    expect(markup).not.toContain('data-state="unavailable"');
  });

  it("keeps menu and item loading independent", () => {
    harness.menuLoading = true;
    let markup = renderToStaticMarkup(render());
    expect(markup.match(/data-state="loading"/g)).toHaveLength(3);
    expect(markup).not.toContain("itemsCount");
    expect(list().loading).toBe(false);
    harness.menuLoading = false;
    harness.fetching = true;
    expect(list().loading).toBe(true);
    markup = renderToStaticMarkup(render());
    expect(markup.match(/data-state="loading"/g)).toHaveLength(1);
  });

  it("reports item query errors without discarding the existing detail-first data", () => {
    harness.error = true;
    expect(list()).toMatchObject({ items: [item], error: "unableToLoad", refetch: harness.refetch });
    const markup = renderToStaticMarkup(render());
    expect(markup).toContain('data-state="error"');
    expect(markup).toContain("Margherita");
  });
});

describe("associated item list parity, including POS caller", () => {
  const props = { items: [item], refetch: harness.refetch };
  const render = (overrides: Partial<ComponentProps<typeof ItemList>> = {}) => run(() => ItemList({ ...props, ...overrides }));
  const modal = (tree: ReactNode) => element<ComponentProps<typeof CreateMenuItemModal>>(tree, CreateMenuItemModal).props;

  it.each([false, true])("preserves branch-admin permission=%s independently of editing", (branchAdmin) => {
    harness.branchAdmin = branchAdmin;
    const card = element<ComponentProps<typeof MenuItemCard>>(render({ editing: false }), MenuItemCard).props;
    expect(card.editing).toBe(!branchAdmin);
    expect(card.onDelete).toBe(harness.refetch);
    card.onEdit?.();
    expect(modal(render())).toMatchObject({ open: true, initialData: item, onSuccess: harness.refetch });
    modal(render()).onOpenChange(false);
    expect(modal(render())).toMatchObject({ open: false, initialData: null });
  });

  it("preserves create actions and an open modal across a query failure", () => {
    const section = element<ComponentProps<typeof SectionCard>>(render(), SectionCard).props;
    click(section.action, "addNewItem");
    const failed = render({ items: [], error: "Query failed" });
    expect(modal(failed)).toMatchObject({ open: true, initialData: null });
    const markup = renderToStaticMarkup(failed);
    expect(markup).toContain('role="alert"');
    expect(markup).not.toContain('data-state="empty"');
    expect(markup).toContain("addNewItem");
  });

  it("preserves empty-state create and showAddNew suppression", () => {
    const empty = render({ items: [] });
    click(element<ComponentProps<typeof StatePanel>>(empty, StatePanel).props.action, "addNewItem");
    expect(modal(render()).open).toBe(true);
    const markup = renderToStaticMarkup(render({ items: [], showAddNew: false }));
    expect(markup).toContain('data-state="empty"');
    expect(markup).not.toContain("addNewItem");
  });

  it("keeps loading precedence over error and hides stale cards during refresh", () => {
    const markup = renderToStaticMarkup(render({ loading: true, error: "Failure" }));
    expect(markup).toContain('data-state="loading"');
    expect(markup).not.toContain('data-state="error"');
    expect(markup).not.toContain("Margherita");
  });

  it("preserves POS grid, counts, manual load-more and terminal states", () => {
    harness.pathname = "/pos";
    const loadMore = vi.fn();
    const tree = render({ hasMore: true, onLoadMore: loadMore, shownCount: 1, totalCount: 15, showAddNew: false });
    click(tree, "Load more items");
    expect(loadMore).toHaveBeenCalledOnce();
    const markup = renderToStaticMarkup(tree);
    expect(markup).toContain("lg:grid-cols-3");
    expect(markup).toContain("Showing 1 of 15 items");
    expect(markup).not.toContain("addNewItem");
    expect(renderToStaticMarkup(render({ hasMore: true, isLoadingMore: true }))).toContain("Loading more items...");
    expect(renderToStaticMarkup(render())).toContain("All items loaded");
    harness.pathname = "/menu/listing";
    expect(renderToStaticMarkup(render())).not.toContain("All items loaded");
  });
});
