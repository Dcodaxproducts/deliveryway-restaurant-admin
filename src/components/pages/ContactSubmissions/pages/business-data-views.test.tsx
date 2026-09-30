import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ResponsiveDataView,
  type ResponsiveDataViewProps,
} from "@/components/common/ResponsiveDataView";
import { FilterBar, type FilterBarProps } from "@/components/common/FilterBar";
import { FilterActions } from "@/components/common/FilterActions";
import { SearchField } from "@/components/common/SearchField";
import PageHeader from "@/components/common/PageHeader";
import { RowActions } from "@/components/common/RowActions";
import PaginationSection from "@/components/common/PaginationSection";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Switch } from "@/components/ui/switch";
import RolesTable from "@/components/pages/Employees/components/employee-settings/RolesTable";
import { AddRoleModal } from "@/components/pages/Employees/components/employee-settings/AddRoleModal";
import GiftCardsTable from "@/components/pages/Promotions/gift-cards/components/GiftCardsTable";
import {
  formatGiftCardAmount,
  formatGiftCardDate,
} from "@/components/pages/Promotions/gift-cards/utils/gift-card-formatters";
import TableReservationsFilters, {
  type TableReservationsFilterState,
} from "@/components/pages/TableReservations/components/TableReservationsFilters";
import type { ContactSubmission } from "@/types/contact-submissions";
import type { GiftCard } from "@/types/gift-cards";
import ContactSubmissionsPage from "./ContactSubmissionsPage";

const harness = vi.hoisted(() => ({
  active: false,
  cursor: 0,
  state: [] as unknown[],
  effects: [] as Array<() => void | (() => void)>,
  response: {} as unknown,
  loading: false,
  fetching: false,
  error: null as Error | null,
  branchAdmin: false,
  query: vi.fn(),
  branches: vi.fn(),
  refetch: vi.fn(),
  status: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  navigate: vi.fn(),
  currency: vi.fn(),
  resolveCurrency: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

// Drive only the owned parents' hooks. Render canonical components with real
// React, and invoke the returned controls to check their existing contracts.
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: <T,>(initial: T | (() => T)) => {
      if (!harness.active) return react.useState(initial);
      const index = harness.cursor++;
      if (!(index in harness.state))
        harness.state[index] =
          typeof initial === "function" ? (initial as () => T)() : initial;
      return [
        harness.state[index],
        (value: T | ((previous: T) => T)) => {
          harness.state[index] =
            typeof value === "function"
              ? (value as (previous: T) => T)(harness.state[index] as T)
              : value;
        },
      ];
    },
    useMemo: <T,>(factory: () => T, deps: unknown[]) =>
      harness.active ? factory() : react.useMemo(factory, deps),
    useCallback: <T extends (...args: never[]) => unknown>(
      callback: T,
      deps: unknown[],
    ) => (harness.active ? callback : react.useCallback(callback, deps)),
    useEffect: (...args: Parameters<typeof react.useEffect>) => {
      if (harness.active) harness.effects.push(args[0]);
      else react.useEffect(...args);
    },
  };
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/contact-submissions",
  useRouter: () => ({ push: harness.navigate }),
}));
vi.mock("@/lib/fonts", () => ({ poppins: { className: "font-poppins" } }));
vi.mock("sonner", () => ({
  toast: { success: harness.toastSuccess, error: harness.toastError },
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    restaurantId: "restaurant-1",
    branchId: "assigned-branch",
    isBranchAdmin: harness.branchAdmin,
    user: { branchName: "Assigned branch" },
  }),
}));
vi.mock("@/components/providers/auth-provider", () => ({
  useAuthContext: () => ({
    user: { role: harness.branchAdmin ? "BRANCH_ADMIN" : "BUSINESS_ADMIN" },
  }),
}));
vi.mock("@/hooks/useBranches", () => ({
  useGetBranches: (params: unknown) => {
    harness.branches(params);
    return { data: { data: [{ id: "branch-2", name: "West branch" }] } };
  },
}));
vi.mock("@/hooks/useContactSubmissions", () => ({
  useContactSubmissions: (params: unknown) => {
    harness.query(params);
    return {
      data: harness.response,
      isLoading: harness.loading,
      isFetching: harness.fetching,
      error: harness.error,
      refetch: harness.refetch,
    };
  },
  useUpdateContactSubmissionStatus: () => ({ mutateAsync: harness.status }),
  useContactSubmission: () => ({ data: undefined }),
  useReplyToContactSubmission: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
vi.mock("@/hooks/useEmployees", () => ({
  useGetStaffRoles: (params: unknown) => {
    harness.query(params);
    return {
      data: harness.response,
      isLoading: harness.loading,
      error: harness.error,
      refetch: harness.refetch,
    };
  },
  useUpdateStaffRole: () => ({ mutateAsync: harness.updateRole }),
  useDeleteStaffRole: () => ({ mutateAsync: harness.deleteRole }),
}));
vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: (restaurantId: unknown) => {
    harness.currency(restaurantId);
    return { resolveCurrency: harness.resolveCurrency };
  },
}));
vi.mock(
  "@/components/pages/Employees/components/employee-settings/AddRoleModal",
  () => ({ AddRoleModal: () => null }),
);

const submission: ContactSubmission = {
  id: "submission-1",
  restaurantId: "restaurant-1",
  branchId: "branch-2",
  name: "Test customer",
  email: "customer@example.test",
  subject: "Booking question",
  message: "Can we bring a birthday cake?",
  status: "NEW",
  createdAt: "2026-09-10T10:00:00Z",
  updatedAt: null,
  repliedAt: null,
  replySubject: null,
  replyMessage: null,
  restaurant: null,
  branch: { id: "branch-2", name: "West branch" },
};
const giftCard: GiftCard = {
  id: "gift-card-12345678",
  code: "BIRTHDAY",
  title: "Birthday gift",
  description: "Dinner credit",
  kind: "GIFT_CARD",
  status: "ACTIVE",
  discountValue: 12.5,
  amount: 12.5,
  currency: "EUR",
  maxUses: 10,
  maxUsesPerCustomer: 2,
  usedCount: 3,
  startsAt: "2026-09-01T00:00:00Z",
  expiresAt: "2026-10-01T00:00:00Z",
  isActive: true,
  restaurant: { id: "restaurant-1", name: "Test restaurant" },
  branch: { id: "branch-2", name: "West branch" },
};
const role = {
  id: "role-1",
  name: "Shift lead",
  description: "Evening staff",
  isActive: true,
  permissions: [
    { access: "Orders", operations: ["Read", "Update"] },
    { id: "permission-2", access: "Custom", operations: ["Approve"] },
  ],
};
const meta = {
  page: 2,
  limit: 20,
  total: 42,
  totalPages: 3,
  hasNext: true,
  hasPrevious: true,
};
type Node = ReactElement<Record<string, unknown>>;

function run(render: () => ReactNode) {
  harness.cursor = 0;
  harness.effects = [];
  harness.active = true;
  try {
    return render();
  } finally {
    harness.active = false;
  }
}

function nodes(tree: ReactNode): Node[] {
  return Children.toArray(tree).flatMap((child) =>
    isValidElement<Record<string, unknown>>(child)
      ? [child, ...nodes(child.props.children as ReactNode)]
      : [],
  );
}

function find(tree: ReactNode, predicate: (node: Node) => boolean): Node {
  const node = nodes(tree).find(predicate);
  expect(node).toBeDefined();
  return node!;
}

function view<T>(tree: ReactNode) {
  return find(tree, (node) => node.type === ResponsiveDataView) as ReactElement<
    ResponsiveDataViewProps<T>
  >;
}

function fire(node: Node, event = "onClick", value?: unknown) {
  return (node.props[event] as (value?: unknown) => unknown)(value);
}

function button(tree: ReactNode, label: string) {
  return find(
    tree,
    (node) =>
      node.props.label === label ||
      (node.type === Button &&
        Children.toArray(node.props.children as ReactNode).includes(label)),
  );
}

function contact() {
  return run(ContactSubmissionsPage);
}
function roles() {
  return run(() =>
    RolesTable({ restaurantId: "restaurant-1", branchId: "branch-2" }),
  );
}
function gifts(onDelete = vi.fn(), rows = [giftCard]) {
  return run(() =>
    GiftCardsTable({
      giftCards: rows,
      loading: harness.loading,
      error: harness.error,
      onDelete,
    }),
  );
}
function contactFilters(tree: ReactNode) {
  return contactFilterBar(tree).props.filters;
}
function contactFilterBar(tree: ReactNode) {
  return find(
    tree,
    (node) => node.type === FilterBar,
  ) as ReactElement<FilterBarProps>;
}
function contactHeaderActions(tree: ReactNode) {
  return find(tree, (node) => node.type === PageHeader).props
    .actions as ReactNode;
}

beforeEach(() => {
  vi.resetAllMocks();
  harness.state = [];
  harness.effects = [];
  harness.response = {};
  harness.loading = false;
  harness.fetching = false;
  harness.error = null;
  harness.branchAdmin = false;
  harness.resolveCurrency.mockImplementation(
    (currency?: string) => currency || "GBP",
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe.each([
  {
    name: "contact submissions",
    seed: () => {
      harness.response = { submissions: [submission], meta };
    },
    render: contact,
    identity: submission.name,
    columns: ["customer", "message", "branch", "received", "status", "actions"],
  },
  {
    name: "staff roles",
    seed: () => {
      harness.response = { data: [role] };
    },
    render: roles,
    identity: role.name,
    columns: [
      "serial",
      "role",
      "description",
      "permissions",
      "status",
      "actions",
    ],
  },
  {
    name: "gift cards",
    seed: () => undefined,
    render: () => gifts(),
    identity: giftCard.title,
    columns: [
      "giftCard",
      "amount",
      "usage",
      "schedule",
      "status",
      "branch",
      "actions",
    ],
  },
])("$name canonical view", (family) => {
  it("keeps one desktop table and the same record on mobile", () => {
    family.seed();
    const element = view(family.render());
    expect(element.props.columns.map((column) => column.id)).toEqual(
      family.columns,
    );
    expect(element.props.data).toHaveLength(1);
    const markup = renderToStaticMarkup(element);
    expect(markup.match(/<table\b/g)).toHaveLength(1);
    expect(markup).toContain('data-slot="responsive-data-view"');
    expect(markup).toContain("hidden md:block");
    expect(markup).toContain("md:hidden");
    expect(markup.split(family.identity).length - 1).toBeGreaterThanOrEqual(2);
  });

  it("shows loading on both layouts, without stale records or actions", () => {
    family.seed();
    harness.loading = true;
    const markup = renderToStaticMarkup(view(family.render()));
    expect(markup.match(/role="status"/g)).toHaveLength(2);
    expect(markup).not.toContain(family.identity);
    expect(markup).not.toContain("<table");
  });

  it.each(["Network unavailable", ""])(
    "shows query errors instead of cached rows or empty results (%s)",
    (message) => {
      family.seed();
      harness.error = new Error(message);
      const markup = renderToStaticMarkup(view(family.render()));
      expect(markup.match(/data-state="error"/g)).toHaveLength(2);
      expect(markup.match(/role="alert"/g)).toHaveLength(2);
      if (message) expect(markup).toContain(message);
      expect(markup).not.toContain(family.identity);
    },
  );

  it("renders the original empty title and description in both layouts", () => {
    const element = view(
      family.name === "gift cards" ? gifts(vi.fn(), []) : family.render(),
    );
    const markup = renderToStaticMarkup(element);
    expect(markup.match(/data-state="empty"/g)).toHaveLength(2);
    expect(markup).toContain(element.props.emptyTitle);
    expect(markup).toContain(element.props.emptyDescription!);
  });
});

describe("contact submission contracts", () => {
  beforeEach(() => {
    harness.response = { submissions: [submission], meta };
  });

  it("keeps restaurant and branch-admin query scoping", () => {
    contact();
    expect(harness.query).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
      restaurantId: "restaurant-1",
      branchId: undefined,
      status: undefined,
      search: undefined,
    });
    expect(harness.branches).toHaveBeenLastCalledWith({
      restaurantId: "restaurant-1",
      includeInactive: false,
      sortOrder: "ASC",
    });
    harness.branchAdmin = true;
    const filters = contactFilters(contact());
    expect(harness.query.mock.lastCall?.[0].branchId).toBe("assigned-branch");
    expect(harness.branches).toHaveBeenLastCalledWith(undefined);
    expect(
      nodes(filters).filter((node) => node.type === FormSelect),
    ).toHaveLength(1);
    expect(renderToStaticMarkup(<>{filters}</>)).toContain("Assigned branch");
  });

  it("retains status/branch filtering, page resets, and clear filters", () => {
    let tree = contact();
    fire(
      find(tree, (node) => node.type === PaginationSection),
      "onPageChange",
      3,
    );
    let filters = contactFilters(contact());
    fire(
      find(
        filters,
        (node) => node.type === FormSelect && node.props.value === "ALL",
      ),
      "onChange",
      { target: { value: "ARCHIVED" } },
    );
    filters = contactFilters(contact());
    fire(
      find(
        filters,
        (node) => node.type === FormSelect && node.props.value === "",
      ),
      "onChange",
      { target: { value: "branch-2" } },
    );
    tree = contact();
    expect(harness.query.mock.lastCall?.[0]).toMatchObject({
      page: 1,
      status: "ARCHIVED",
      branchId: "branch-2",
    });
    fire(button(contactFilterBar(tree).props.actions, "Clear filters"));
    contact();
    expect(harness.query.mock.lastCall?.[0]).toMatchObject({
      page: 1,
      status: undefined,
      branchId: undefined,
      search: undefined,
    });
  });

  it("keeps 400ms trimmed search and resets pagination", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const tree = contact();
    fire(
      find(tree, (node) => node.type === PaginationSection),
      "onPageChange",
      3,
    );
    fire(
      find(contactFilterBar(tree).props.search, (node) => node.type === SearchField),
      "onChange",
      { target: { value: "  cake  " } },
    );
    contact();
    const cleanup = harness.effects[0]();
    vi.advanceTimersByTime(399);
    contact();
    expect(harness.query.mock.lastCall?.[0]).toMatchObject({
      page: 3,
      search: undefined,
    });
    vi.advanceTimersByTime(1);
    contact();
    expect(harness.query.mock.lastCall?.[0]).toMatchObject({
      page: 1,
      search: "cake",
    });
    cleanup?.();
  });

  it("preserves server pagination, limit changes and refresh", () => {
    const tree = contact();
    const pagination = find(tree, (node) => node.type === PaginationSection);
    expect(pagination.props).toMatchObject(meta);
    fire(pagination, "onPageChange", 3);
    contact();
    expect(harness.query.mock.lastCall?.[0].page).toBe(3);
    fire(
      find(tree, (node) => node.type === FormSelect && node.props.value === "20"),
      "onChange",
      { target: { value: "50" } },
    );
    contact();
    expect(harness.query.mock.lastCall?.[0]).toMatchObject({
      page: 1,
      limit: 50,
    });
    fire(button(contactHeaderActions(tree), "Refresh"));
    expect(harness.refetch).toHaveBeenCalledOnce();
    harness.fetching = true;
    expect(button(contactHeaderActions(contact()), "Refresh").props.disabled).toBe(true);
    expect(view(contact()).props.loading).toBe(false);
  });

  it("retains all desktop actions and exact mutation payloads", async () => {
    const element = view<ContactSubmission>(contact());
    const actions = find(
      element.props.columns
        .find((column) => column.id === "actions")!
        .cell(submission),
      (node) => node.type === RowActions,
    ).props.actions as Array<{ id: string; onSelect: () => unknown }>;
    expect(actions.map((action) => action.id)).toEqual([
      "view",
      "read",
      "reply",
      "archive",
    ]);
    await actions[1].onSelect();
    await actions[3].onSelect();
    expect(harness.status.mock.calls).toEqual([
      [{ id: submission.id, payload: { status: "READ" } }],
      [{ id: submission.id, payload: { status: "ARCHIVED" } }],
    ]);
    actions[0].onSelect();
    expect(
      find(contact(), (node) => node.props.submissionId === submission.id).props
        .open,
    ).toBe(true);
    actions[2].onSelect();
    expect(
      find(contact(), (node) => node.props.submission === submission).props
        .open,
    ).toBe(true);
  });

  it("keeps mobile view/reply actions and dialog close behavior", () => {
    const element = view<ContactSubmission>(contact());
    const card = element.props.renderMobileItem(submission);
    fire(button(card, "View"));
    const detail = find(
      contact(),
      (node) => node.props.submissionId === submission.id,
    );
    fire(detail, "onOpenChange", false);
    expect(
      nodes(contact()).some(
        (node) => node.props.submissionId === submission.id,
      ),
    ).toBe(false);
    fire(button(card, "Reply"));
    const reply = find(
      contact(),
      (node) => node.props.submission === submission,
    );
    fire(reply, "onOpenChange", false);
    expect(
      nodes(contact()).some((node) => node.props.submission === submission),
    ).toBe(false);
    expect(harness.status).not.toHaveBeenCalled();
  });

  it("preserves missing-field fallbacks and stable row identity", () => {
    const row = {
      ...submission,
      name: "",
      subject: "",
      branch: null,
      branchId: null,
      createdAt: null,
    };
    harness.response = { submissions: [row], meta };
    const element = view<ContactSubmission>(contact());
    expect(element.props.rowKey(row)).toBe(row.id);
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain("All branches");
    expect(markup).toContain("No subject");
    expect(markup).toContain(row.email);
  });
});

describe("gift card contracts", () => {
  it("retains currency resolution, usage, schedules and branch in both layouts", () => {
    const element = view<GiftCard>(gifts());
    expect(element.props.rowKey(giftCard)).toBe(giftCard.id);
    expect(harness.currency).toHaveBeenCalledWith("restaurant-1");
    const markup = renderToStaticMarkup(element);
    for (const text of [
      giftCard.code,
      giftCard.description!,
      formatGiftCardAmount(12.5, "EUR"),
      formatGiftCardDate(giftCard.startsAt),
      formatGiftCardDate(giftCard.expiresAt),
      "West branch",
    ]) {
      expect(markup.split(text).length - 1).toBeGreaterThanOrEqual(2);
    }
    expect(harness.resolveCurrency).toHaveBeenCalledWith("EUR");
    expect(markup).toContain("3 / 10");
    expect(markup).toContain("perCustomer");
    expect(markup).toContain("perUser");
  });

  it.each(["desktop", "mobile"])(
    "keeps %s edit navigation and delete selection",
    (layout) => {
      const onDelete = vi.fn();
      const element = view<GiftCard>(gifts(onDelete));
      const controls =
        layout === "mobile"
          ? element.props.renderMobileItem(giftCard)
          : element.props.columns
              .find((column) => column.id === "actions")!
              .cell(giftCard);
      fire(button(controls, "edit"));
      expect(harness.navigate).toHaveBeenCalledExactlyOnceWith(
        `/promotion-management/gift-cards/${giftCard.id}/edit`,
      );
      fire(button(controls, "delete"));
      expect(onDelete).toHaveBeenCalledExactlyOnceWith(giftCard);
    },
  );

  it("retains image and missing-data presentation without inventing values", () => {
    const row = {
      ...giftCard,
      code: "",
      description: null,
      currency: null,
      branch: null,
      maxUses: null,
      maxUsesPerCustomer: null,
      thumbnailUrl: "https://example.test/card.png",
    };
    const markup = renderToStaticMarkup(view<GiftCard>(gifts(vi.fn(), [row])));
    expect(markup.match(/<img\b/g)).toHaveLength(2);
    expect(markup).toContain(row.thumbnailUrl);
    expect(markup).toContain("allBranches");
    expect(markup).toContain("noDescription");
    expect(markup).toContain(formatGiftCardAmount(row.amount, "GBP"));
  });
});

describe("role contracts", () => {
  beforeEach(() => {
    harness.response = { data: [role] };
  });

  it("retains scoped query and refresh effect", () => {
    roles();
    expect(harness.query).toHaveBeenLastCalledWith({
      restaurantId: "restaurant-1",
      branchId: "branch-2",
    });
    harness.effects[0]();
    expect(harness.refetch).toHaveBeenCalledOnce();
    harness.branchAdmin = true;
    roles();
    expect(harness.query).toHaveBeenLastCalledWith(undefined);
  });

  it("keeps role order and translated/custom permissions", () => {
    const other = { ...role, id: "role-2", name: "Trainee", permissions: [] };
    harness.response = { data: [role, other] };
    const element = view<typeof role>(roles());
    expect(element.props.rowKey(role)).toBe(role.id);
    expect(element.props.columns[0].cell(other)).toBe(2);
    const markup = renderToStaticMarkup(element);
    expect(markup.split("access.Orders").length - 1).toBe(2);
    expect(markup.split("operations.Read, operations.Update").length - 1).toBe(
      2,
    );
    expect(markup.split("Custom (Approve)").length - 1).toBe(2);
  });

  it.each(["desktop", "mobile"])(
    "preserves %s status/edit/delete handlers",
    async (layout) => {
      const element = view<typeof role>(roles());
      const controls =
        layout === "mobile"
          ? element.props.renderMobileItem(role)
          : element.props.columns.map((column) => (
              <div key={column.id}>{column.cell(role)}</div>
            ));
      const toggle = find(controls, (node) => node.type === Switch);
      expect(toggle.props.checked).toBe(true);
      expect(toggle.props["aria-label"]).toContain(role.name);
      await fire(toggle, "onCheckedChange", false);
      expect(harness.updateRole).toHaveBeenCalledExactlyOnceWith({
        id: role.id,
        data: { isActive: false },
      });
      expect(harness.refetch).toHaveBeenCalledOnce();
      fire(button(controls, "actions.edit"));
      const modal = find(roles(), (node) => node.type === AddRoleModal);
      expect(modal.props).toMatchObject({
        open: true,
        initialData: role,
        restaurantId: "restaurant-1",
        branchId: "branch-2",
      });
      fire(modal, "onOpenChange", false);
      expect(
        find(roles(), (node) => node.type === AddRoleModal).props,
      ).toMatchObject({ open: false, initialData: null });
      await fire(button(controls, "actions.delete"));
      expect(harness.deleteRole).toHaveBeenCalledExactlyOnceWith(role.id);
      expect(harness.refetch).toHaveBeenCalledTimes(2);
    },
  );

  it("retains mutation error feedback and does not refetch on failures", async () => {
    harness.updateRole.mockRejectedValueOnce(new Error("Update failed"));
    harness.deleteRole.mockRejectedValueOnce(new Error("Delete failed"));
    const element = view<typeof role>(roles());
    const card = element.props.renderMobileItem(role);
    await fire(
      find(card, (node) => node.type === Switch),
      "onCheckedChange",
      false,
    );
    await fire(button(card, "actions.delete"));
    expect(harness.toastError.mock.calls).toEqual([
      ["messages.failedUpdateStatus"],
      ["messages.deleteFailed"],
    ]);
    expect(harness.refetch).not.toHaveBeenCalled();
    expect(harness.toastSuccess).not.toHaveBeenCalled();
  });
});

describe("reservation FilterBar contracts", () => {
  const defaults: TableReservationsFilterState = {
    search: "",
    status: "ALL",
    sortBy: "reservationDate",
    sortOrder: "DESC",
    branchId: "",
  };
  function filters(
    onFiltersChange = vi.fn(),
    overrides: Partial<TableReservationsFilterState> = {},
  ) {
    return run(() =>
      TableReservationsFilters({
        filters: { ...defaults, ...overrides },
        branchOptions: [{ id: "branch-2", name: "West branch" }],
        isBranchAdmin: harness.branchAdmin,
        branchName: "Assigned branch",
        visibleCount: 3,
        totalCount: 42,
        isFetching: harness.fetching,
        onFiltersChange,
      }),
    ) as ReactElement<FilterBarProps>;
  }

  it("uses the canonical shell, all options, counts and fetching feedback", () => {
    harness.fetching = true;
    const element = filters();
    expect(element.type).toBe(FilterBar);
    const markup = renderToStaticMarkup(element);
    expect(markup.match(/data-slot="filter-bar"/g)).toHaveLength(1);
    expect(markup).toContain("showingOf");
    expect(markup).toContain("visibleCount&quot;:3");
    expect(markup).toContain("totalCount&quot;:42");
    expect(markup).toContain("refreshing");
    const options = nodes(element.props.filters)
      .filter((node) => node.type === "option")
      .map((node) => node.props.value);
    expect(options).toEqual([
      "ALL",
      "REQUESTED",
      "CONFIRMED",
      "CANCELLED",
      "COMPLETED",
      "SEATED",
      "reservationDate",
      "createdAt",
      "guestCount",
      "DESC",
      "ASC",
      "ALL",
      "branch-2",
    ]);
  });

  it("preserves each filter payload and ALL branch normalization", () => {
    const onChange = vi.fn();
    const controls = filters(onChange).props.filters;
    const select = (label: string, value: string) =>
      fire(
        find(
          controls,
          (node) =>
            node.type === FormSelect && node.props["aria-label"] === label,
        ),
        "onChange",
        { target: { value } },
      );
    select("status", "SEATED");
    select("sortBy", "guestCount");
    select("order", "ASC");
    select("order", "unexpected");
    select("branch", "branch-2");
    select("branch", "ALL");
    expect(onChange.mock.calls).toEqual([
      [{ status: "SEATED" }],
      [{ sortBy: "guestCount" }],
      [{ sortOrder: "ASC" }],
      [{ sortOrder: "DESC" }],
      [{ branchId: "branch-2" }],
      [{ branchId: "" }],
    ]);
  });

  it("keeps the branch-admin selector locked", () => {
    harness.branchAdmin = true;
    const controls = filters().props.filters;
    expect(
      nodes(controls).filter((node) => node.type === FormSelect),
    ).toHaveLength(3);
    const locked = find(
      controls,
      (node) =>
        node.type === Button &&
        node.props.disabled === true &&
        node.props.onClick === undefined,
    );
    expect(renderToStaticMarkup(locked)).toContain("Assigned branch");
  });

  it("leaves search submission to the debounced input contract", () => {
    const onChange = vi.fn();
    let controls = filters(onChange).props.filters;
    fire(
      find(controls, (node) => node.type === SearchField),
      "onChange",
      { target: { value: "  dinner  " } },
    );
    controls = filters(onChange).props.filters;
    const actions = find(controls, (node) => node.type === FilterActions);
    expect(actions.props.onSearch).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("retains 400ms debounce and cancels obsolete searches", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const onChange = vi.fn();
    let controls = filters(onChange).props.filters;
    fire(
      find(controls, (node) => node.type === SearchField),
      "onChange",
      { target: { value: "old" } },
    );
    controls = filters(onChange).props.filters;
    const cancel = harness.effects[0]();
    vi.advanceTimersByTime(200);
    cancel?.();
    fire(
      find(controls, (node) => node.type === SearchField),
      "onChange",
      { target: { value: "  latest  " } },
    );
    filters(onChange);
    const cleanup = harness.effects[0]();
    vi.advanceTimersByTime(399);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ search: "latest" });
    cleanup?.();
  });

  it("preserves reset defaults and its disabled/fetching rules", () => {
    const onChange = vi.fn();
    expect(
      find(
        filters(onChange).props.filters,
        (node) => node.type === FilterActions,
      ).props.resetDisabled,
    ).toBe(true);
    harness.fetching = true;
    expect(
      find(
        filters(onChange).props.filters,
        (node) => node.type === FilterActions,
      ).props.resetDisabled,
    ).toBe(false);
    harness.fetching = false;
    const controls = filters(onChange, {
      status: "CONFIRMED",
      branchId: "branch-2",
      sortOrder: "ASC",
    }).props.filters;
    fire(
      find(controls, (node) => node.type === SearchField),
      "onChange",
      { target: { value: "cake" } },
    );
    fire(find(controls, (node) => node.type === FilterActions), "onReset");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(defaults);
    expect(
      find(filters(onChange).props.filters, (node) => node.type === SearchField)
        .props.value,
    ).toBe("");
  });
});
