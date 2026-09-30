import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbstractIntlMessages } from "next-intl";

import type { RowActionsProps } from "@/components/common/RowActions";
import TableReservationsFilters from "@/components/pages/TableReservations/components/TableReservationsFilters";
import TableReservationsPagination from "@/components/pages/TableReservations/components/TableReservationsPagination";
import { TableReservationsTable } from "@/components/pages/TableReservations/components/TableReservationsTable";
import { WalkInQueuePanel } from "@/components/pages/TableReservations/components/WalkInQueuePanel";
import { TableReservationDetailsPage } from "@/components/pages/TableReservations/pages/TableReservationDetailsPage";
import { TableReservationsPage } from "@/components/pages/TableReservations/pages/TableReservationsPage";
import { formatShortId } from "@/components/pages/TableReservations/utils/table-reservations-formatters";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import type { TableReservation, TableReservationsParams } from "@/types/table-reservations";

const harness = vi.hoisted(() => ({
  locale: "en" as "en" | "de",
  active: false,
  cursor: 0,
  state: [] as unknown[],
  effects: [] as Array<() => void | (() => void)>,
  search: "",
  reservationId: "reservation-1234",
  auth: {
    restaurantId: "restaurant-1" as string | undefined,
    branchId: undefined as string | undefined,
    isBranchAdmin: false,
    isPosPrinter: false,
    user: { branchName: "Assigned branch" },
  },
  list: {
    data: undefined as unknown,
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  detail: {
    data: undefined as unknown,
    isLoading: false,
    isError: false,
    error: null as unknown,
    refetch: vi.fn(),
  },
  listParams: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  mutate: vi.fn(),
  createWalkIn: vi.fn(),
}));

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
    useCallback: <T extends (...args: never[]) => unknown>(callback: T, deps: unknown[]) =>
      harness.active ? callback : react.useCallback(callback, deps),
    useEffect: (...args: Parameters<typeof react.useEffect>) => {
      if (harness.active) harness.effects.push(args[0]);
      else react.useEffect(...args);
    },
  };
});

// Real message interpolation with fail-fast errors so missing EN/DE keys break the test.
vi.mock("next-intl", async (importOriginal) => {
  const original = await importOriginal<typeof import("next-intl")>();
  return {
    ...original,
    useTranslations: (namespace: string) =>
      original.createTranslator({
        locale: harness.locale,
        messages: (harness.locale === "en" ? en : de) as AbstractIntlMessages,
        namespace,
        onError: (error) => {
          throw error;
        },
      }),
  };
});
vi.mock("next/navigation", () => ({
  usePathname: () => "/table-reservations",
  useRouter: () => ({ push: harness.push, replace: harness.replace }),
  useSearchParams: () => new URLSearchParams(harness.search),
  useParams: () => ({ reservationId: harness.reservationId }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/fonts", () => ({
  poppins: { className: "font-poppins" },
  onest: { className: "font-onest" },
  arimo: { className: "font-arimo" },
  barlow: { className: "font-barlow" },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => harness.auth }));
vi.mock("@/hooks/useBranches", () => ({
  useGetBranches: () => ({ data: { data: [{ id: "branch-2", name: "West branch" }] } }),
}));
vi.mock("@/hooks/useTableReservations", () => ({
  useTableReservations: (params: TableReservationsParams) => {
    harness.listParams(params);
    return harness.list;
  },
  useTableReservation: () => harness.detail,
  useUpdateTableReservationStatus: () => ({ mutateAsync: harness.mutate, isPending: false }),
  useCreateWalkInReservation: () => ({ mutateAsync: harness.createWalkIn, isPending: false }),
}));
// Render dropdown action text so both layout call sites are checked, not only the trigger.
vi.mock("@/components/common/RowActions", () => ({
  RowActions: ({ actions, label }: RowActionsProps) => (
    <div data-testid="row-actions" aria-label={label}>
      {actions
        .filter((action) => !action.hidden)
        .map((action) => (
          <button key={action.id} type="button" data-action={action.id} onClick={action.onSelect}>
            {action.label}
          </button>
        ))}
    </div>
  ),
}));

type Node = ReactElement<Record<string, unknown>>;

const customer = {
  id: "customer-1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "+49 30 1234",
  avatarUrl: null,
};
const walkInCustomer = {
  id: "guest-1",
  email: "pos-guest-restaurant-1-branch-1-1700000000-abc123@feastflow.local",
  firstName: "Walk-in",
  lastName: "Customer",
  phone: null,
  avatarUrl: null,
};
const reservation: TableReservation = {
  id: "reservation-1234",
  branchId: "branch-1",
  branch: { id: "branch-1", name: "Central", address: "42 Main Street" },
  createdAt: "2026-09-30T09:00:00Z",
  cancelledAt: null,
  reservationDate: "2026-09-30T18:00:00Z",
  guestCount: 4,
  note: "Window seat",
  status: "CONFIRMED",
  customer,
};
const walkInQueued: TableReservation = {
  ...reservation,
  id: "walk-in-queued",
  status: "REQUESTED",
  createdAt: "2026-09-30T11:00:00Z",
  reservationDate: "2026-09-30T11:20:00Z",
  guestCount: 2,
  customer: walkInCustomer,
};
const walkInSeated: TableReservation = {
  ...walkInQueued,
  id: "walk-in-seated",
  status: "SEATED",
  reservationDate: "2026-09-30T11:05:00Z",
};
const walkInDone: TableReservation = {
  ...walkInQueued,
  id: "walk-in-done",
  status: "COMPLETED",
};
const meta = { page: 2, limit: 20, total: 42, totalPages: 3, hasNext: true, hasPrevious: true };

function run<T>(render: () => T) {
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
      : []
  );
}

function find(tree: ReactNode, predicate: (node: Node) => boolean): Node {
  const node = nodes(tree).find(predicate);
  expect(node).toBeDefined();
  return node!;
}

function byType(tree: ReactNode, type: unknown) {
  return find(tree, (node) => node.type === type);
}

function render(tree: ReactNode) {
  return renderToStaticMarkup(<>{tree}</>);
}

const messages = () => (harness.locale === "en" ? en : de).tableReservations;

beforeEach(() => {
  vi.clearAllMocks();
  harness.locale = "en";
  harness.state = [];
  harness.effects = [];
  harness.search = "";
  harness.reservationId = "reservation-1234";
  harness.auth = {
    restaurantId: "restaurant-1",
    branchId: undefined,
    isBranchAdmin: false,
    isPosPrinter: false,
    user: { branchName: "Assigned branch" },
  };
  harness.list = {
    data: { reservations: [reservation, walkInQueued, walkInSeated, walkInDone], meta },
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    error: null,
    refetch: vi.fn(),
  };
  harness.detail = { data: reservation, isLoading: false, isError: false, error: null, refetch: vi.fn() };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("table reservations list state", () => {
  it("restores page, limit, and filters from the URL and sends supported params", () => {
    harness.search = "page=2&limit=50&status=CONFIRMED&search=ada&sortBy=guestCount&sortOrder=ASC&branchId=branch-2";
    const tree = run(TableReservationsPage);

    expect(harness.listParams).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      search: "ada",
      sortBy: "guestCount",
      sortOrder: "ASC",
      restaurantId: "restaurant-1",
      branchId: "branch-2",
      status: "CONFIRMED",
    });
    const table = byType(tree, TableReservationsTable);
    expect(table.props.listQuery).toBe(
      "?search=ada&status=CONFIRMED&sortBy=guestCount&sortOrder=ASC&branchId=branch-2&page=2&limit=50"
    );
    expect(byType(tree, WalkInQueuePanel).props.listQuery).toBe(table.props.listQuery);
    expect(byType(tree, TableReservationsPagination).props.limit).toBe(50);
  });

  it("caps an unsupported URL limit at the API maximum and ignores an invalid status", () => {
    harness.search = "limit=500&status=NO_SHOW&page=x";
    run(TableReservationsPage);

    expect(harness.listParams).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 50, status: undefined })
    );
  });

  it("writes the list state to the URL only when it differs", () => {
    harness.search = "page=3";
    run(TableReservationsPage);
    harness.effects.forEach((effect) => effect());
    expect(harness.replace).not.toHaveBeenCalled();

    harness.state = [];
    harness.search = "";
    const tree = run(TableReservationsPage);
    (byType(tree, TableReservationsPagination).props.onPageChange as (page: number) => void)(3);
    const next = run(TableReservationsPage);
    harness.effects.forEach((effect) => effect());
    expect(harness.replace).toHaveBeenCalledWith("/table-reservations?page=3", { scroll: false });
    expect(byType(next, TableReservationsTable).props.listQuery).toBe("?page=3");
  });

  it("resets to page 1 when a filter changes but keeps every other filter", () => {
    harness.search = "page=3&status=SEATED&limit=10&branchId=branch-2";
    const tree = run(TableReservationsPage);
    const filters = byType(tree, TableReservationsFilters);
    (filters.props.onFiltersChange as (filters: unknown) => void)({ search: "ada" });

    run(TableReservationsPage);
    expect(harness.listParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, limit: 10, status: "SEATED", branchId: "branch-2", search: "ada" })
    );
  });

  it("keeps the page when a filter change is a no-op", () => {
    harness.search = "page=3&status=SEATED";
    const tree = run(TableReservationsPage);
    (byType(tree, TableReservationsFilters).props.onFiltersChange as (filters: unknown) => void)({
      status: "SEATED",
    });

    run(TableReservationsPage);
    expect(harness.listParams).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3, status: "SEATED" }));
  });

  it("changing the page size preserves filters and restarts at page 1", () => {
    harness.search = "page=2&status=CONFIRMED&search=ada";
    const tree = run(TableReservationsPage);
    (byType(tree, TableReservationsPagination).props.onLimitChange as (limit: number) => void)(50);

    run(TableReservationsPage);
    expect(harness.listParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, limit: 50, status: "CONFIRMED", search: "ada" })
    );
  });

  it("snaps a stale deep link back to the last available page", () => {
    harness.search = "page=9";
    harness.list.data = { reservations: [reservation], meta: { ...meta, page: 9, totalPages: 3 } };
    run(TableReservationsPage);
    harness.effects.forEach((effect) => effect());

    run(TableReservationsPage);
    expect(harness.listParams).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));
  });

  it("scopes branch admins and POS printers to their branch regardless of the URL", () => {
    harness.search = "branchId=branch-2";
    harness.auth = { ...harness.auth, branchId: "assigned-branch", isBranchAdmin: true };
    const tree = run(TableReservationsPage);

    expect(harness.listParams).toHaveBeenCalledWith(expect.objectContaining({ branchId: "assigned-branch" }));
    expect(byType(tree, WalkInQueuePanel).props).toMatchObject({
      branchId: "assigned-branch",
      isBranchScoped: true,
      canCreate: true,
    });

    harness.state = [];
    harness.auth = { ...harness.auth, isBranchAdmin: false, isPosPrinter: true };
    expect(byType(run(TableReservationsPage), WalkInQueuePanel).props.canCreate).toBe(false);
  });
});

describe.each(["en", "de"] as const)("table reservations table (%s)", (locale) => {
  beforeEach(() => {
    harness.locale = locale;
  });

  it("links every row to its detail page with the list query and marks walk-ins", () => {
    const markup = render(
      <TableReservationsTable
        reservations={[reservation, walkInQueued]}
        loading={false}
        listQuery="?status=CONFIRMED&page=2"
      />
    );
    const t = messages();

    expect(markup.match(/href="\/table-reservations\/reservation-1234\?status=CONFIRMED&amp;page=2"/g)).toHaveLength(2);
    expect(markup.match(/href="\/table-reservations\/walk-in-queued\?status=CONFIRMED&amp;page=2"/g)).toHaveLength(2);
    expect(markup).toContain(`aria-label="${t.openDetails.replace("{id}", formatShortId(reservation.id))}"`);
    expect(markup.match(new RegExp(`>${t.walkIn}<`, "g"))).toHaveLength(2);
    expect(markup).not.toContain("@feastflow.local");
    expect(markup.match(new RegExp(t.walkInGuest, "g"))).toHaveLength(2);
    expect(markup).toContain("ada@example.com");
    expect(markup.match(new RegExp(`>${(harness.locale === "en" ? en : de).common.viewDetails}<`, "g"))).toHaveLength(4);
  });
});

describe.each(["en", "de"] as const)("walk-in queue (%s)", (locale) => {
  beforeEach(() => {
    harness.locale = locale;
  });

  const panel = (canCreate = true) => (
    <WalkInQueuePanel
      restaurantId="restaurant-1"
      branchId="branch-1"
      isBranchScoped
      branchName="Central"
      branchOptions={[]}
      canCreate={canCreate}
      listQuery="?page=2"
    />
  );

  it("queries walk-in guests through the supported search contract", () => {
    render(panel());
    expect(harness.listParams).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      search: "pos-guest-",
      sortBy: "createdAt",
      sortOrder: "DESC",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });
  });

  it("lists only active walk-ins ordered by expected time with valid actions", () => {
    const markup = render(panel());
    const t = messages();

    expect(markup).toContain(t.walkInQueueCount.replace("{count}", "2"));
    expect(markup).not.toContain("walk-in-done");
    expect(markup).not.toContain("reservation-1234");
    expect(markup.indexOf("walk-in-seated")).toBeLessThan(markup.indexOf("walk-in-queued"));

    const desktop = markup.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
    const rows = desktop.split("<tr").slice(1);
    expect(rows).toHaveLength(2);
    const actions = (row: string) => [...row.matchAll(/data-action="([^"]+)"/g)].map((match) => match[1]);
    expect(actions(rows[0])).toEqual(["assign-table", "complete", "cancel", "view"]);
    expect(actions(rows[1])).toEqual(["assign-table", "confirm", "seat", "noShow", "cancel", "view"]);
    expect(markup).toContain(`>${t.markNoShow}<`);
    expect(markup).toContain(`>${t.addWalkIn}<`);
    expect(markup).toContain(`href="/table-reservations/walk-in-queued?page=2"`);
    expect(markup).not.toContain("@feastflow.local");
  });

  it("hides walk-in creation for POS printer accounts and shows the empty queue", () => {
    harness.list.data = { reservations: [reservation, walkInDone], meta };
    const markup = render(panel(false));
    const t = messages();

    expect(markup).not.toContain(`>${t.addWalkIn}<`);
    expect(markup.match(/data-state="empty"/g)).toHaveLength(2);
    expect(markup).toContain(t.walkInQueueEmptyTitle);
    expect(markup).toContain(t.walkInQueueCount.replace("{count}", "0"));
  });

  it("surfaces queue load errors instead of an empty list", () => {
    harness.list = { ...harness.list, data: undefined, error: new Error("Queue offline") };
    const markup = render(panel());

    expect(markup.match(/data-state="error"/g)).toHaveLength(2);
    expect(markup).toContain("Queue offline");
    expect(markup).toContain(messages().walkInQueueErrorTitle);
  });
});

describe.each(["en", "de"] as const)("reservation detail page (%s)", (locale) => {
  beforeEach(() => {
    harness.locale = locale;
    harness.search = "status=SEATED&page=2&acceptOrder=1";
  });

  it("shows an accessible loading state", () => {
    harness.detail = { ...harness.detail, data: undefined, isLoading: true };
    const markup = render(<TableReservationDetailsPage />);
    expect(markup).toContain(`role="status" aria-label="${messages().loadingDetail}"`);
    expect(markup).not.toContain("reservation-1234");
  });

  it("offers retry and a filtered back link on load errors", () => {
    harness.detail = {
      ...harness.detail,
      data: undefined,
      isError: true,
      error: { response: { data: { message: "Upstream unavailable" } } },
    };
    const markup = render(<TableReservationDetailsPage />);
    const t = messages();

    expect(markup).toContain('data-state="error"');
    expect(markup).toContain("Upstream unavailable");
    expect(markup).toContain(`>${t.retry}<`);
    expect(markup.match(/href="\/table-reservations\?status=SEATED&amp;page=2"/g)).toHaveLength(2);
    expect(markup).not.toContain("acceptOrder");
  });

  it("keeps cached reservation data visible with a retry notice when the refresh fails", () => {
    harness.detail = {
      ...harness.detail,
      isError: true,
      error: { response: { status: 404, data: { message: "Cannot GET detail" } } },
    };
    const markup = render(<TableReservationDetailsPage />);
    const t = messages();

    expect(markup).toContain(t.refreshFailedTitle);
    expect(markup).toContain("Cannot GET detail");
    expect(markup).toContain(`>${t.retry}<`);
    expect(markup).toContain(t.detailTitle.replace("{id}", formatShortId(reservation.id)));
    expect(markup).toContain("Window seat");
    expect(markup).toContain(`>${t.seat}<`);
  });

  it("renders a not-found state when the API returns no reservation", () => {
    harness.detail = { ...harness.detail, data: null };
    const markup = render(<TableReservationDetailsPage />);
    const t = messages();

    expect(markup).toContain('data-state="empty"');
    expect(markup).toContain(t.notFoundTitle);
    expect(markup).toContain(t.notFoundDescription);
    expect(markup).toContain(`href="/table-reservations?status=SEATED&amp;page=2"`);
  });

  it("renders the reservation with only the valid quick actions", () => {
    const markup = render(<TableReservationDetailsPage />);
    const t = messages();
    const common = (harness.locale === "en" ? en : de).common;

    expect(markup).toContain(t.detailTitle.replace("{id}", formatShortId(reservation.id)));
    expect(markup).toContain(`aria-label="${t.backToReservations}"`);
    expect(markup).toContain(`href="/table-reservations?status=SEATED&amp;page=2"`);
    expect(markup).toContain(`>${t.seat}<`);
    expect(markup).toContain(`>${t.markNoShow}<`);
    expect(markup).toContain(`>${t.cancelReservation}<`);
    expect(markup).not.toContain(`>${t.complete}<`);
    expect(markup).not.toContain(`>${t.confirmReservation}<`);
    expect(markup).toContain(`>${common.updateStatus}<`);
    expect(markup).toContain("Window seat");
    expect(markup).toContain("42 Main Street");
    expect(markup).toContain("ada@example.com");
    expect(markup).toContain(`>${t.assignTable}<`);
    expect(markup).toContain(t.status.CONFIRMED);
    expect(markup).toContain(t.tableLabelHelp);
  });

  it("hides internal walk-in emails and table controls once the visit is over", () => {
    harness.detail = { ...harness.detail, data: { ...walkInQueued, status: "NO_SHOW" } };
    const markup = render(<TableReservationDetailsPage />);
    const t = messages();

    expect(markup).not.toContain("@feastflow.local");
    expect(markup).toContain(t.walkInGuest);
    expect(markup).toContain(`>${t.walkIn}<`);
    expect(markup).not.toContain(`>${t.assignTable}<`);
    expect(markup).not.toContain(`>${t.seat}<`);
    expect(markup).not.toContain(`>${t.cancelReservation}<`);
    expect(markup).toContain(t.status.NO_SHOW);
  });
});
