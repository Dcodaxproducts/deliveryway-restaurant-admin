import { FormSelect } from "@/components/ui/form-select";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { StatePanel } from "@/components/common/EmptyState";
import { FilterBar, FilterSheet } from "@/components/common/FilterBar";
import { FilterActions } from "@/components/common/FilterActions";
import { PageTabs } from "@/components/common/PageTabs";
import {
  FormField,
  getFormFieldDescriptionId,
} from "@/components/common/FormField";
import { PageLayout } from "@/components/common/Container";
import PageHeader from "@/components/common/PageHeader";
import {
  getPaginationItems,
  PaginationBar,
} from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/cards/stats-card";
import StatGrid from "@/components/common/stats-section";
import ManagementCard from "@/components/cards/ManagementCard";
import { ConfirmDialog } from "@/components/common/dialogs/delete-dialog";

vi.mock("next/navigation", () => ({
  usePathname: () => "/branches",
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/lib/fonts", () => ({
  poppins: { className: "font-poppins" },
}));

type FixtureRow = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

const rows: FixtureRow[] = [
  { id: "row-1", name: "Main Branch", status: "active" },
];

const columns: readonly DataTableColumn<FixtureRow>[] = [
  { id: "name", header: "Name", cell: (row) => row.name, sortable: true },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge tone={row.status === "active" ? "success" : "neutral"}>
        {row.status}
      </StatusBadge>
    ),
  },
];

describe("shared layout patterns", () => {
  it("composes a page with shared header, actions, and section framing", () => {
    const markup = renderToStaticMarkup(
      <PageLayout width="wide" actions={<Button>Save</Button>}>
        <PageHeader
          title="Branches"
          description="Manage restaurant locations"
          actions={<Button>Add branch</Button>}
          tabs={<nav>Active</nav>}
        />
        <SectionCard
          title="All branches"
          description="One shared section surface"
        >
          Content
        </SectionCard>
      </PageLayout>,
    );

    expect(markup).toContain('data-slot="page-layout"');
    expect(markup).toContain('data-slot="page-header"');
    expect(markup).toContain('data-slot="section-card"');
    expect(markup).toContain("space-y-5");
    expect(markup).toContain("lg:text-2xl");
    expect(markup).toContain("sm:p-5");
    expect(markup).toContain("Add branch");
    expect(markup).toContain("Save");
  });

  it("renders a typed metric with semantic data styling", () => {
    const markup = renderToStaticMarkup(
      <StatCard
        data={{
          _id: "orders",
          title: "Orders",
          value: "1,248",
          icon: "orders",
          trend: { direction: "up", percentage: "8.4%" },
        }}
      />,
    );

    expect(markup).toContain('data-slot="stat-card"');
    expect(markup).toContain("size-9");
    expect(markup).not.toContain("md:p-6");
    expect(markup).toContain("1,248");
    expect(markup).toContain("8.4%");
  });

  it("keeps metric loading cards the same height and caps wide grids at three columns", () => {
    const stats = Array.from({ length: 6 }, (_, index) => ({
      _id: `metric-${index}`,
      title: `Metric ${index + 1}`,
      value: index,
      icon: "orders" as const,
      trend: { direction: "up" as const, percentage: `${index}` },
    }));
    const loadingMarkup = renderToStaticMarkup(
      <StatGrid stats={stats} loading />,
    );
    const loadedMarkup = renderToStaticMarkup(<StatGrid stats={stats} />);

    expect(loadingMarkup).toContain("xl:grid-cols-3");
    expect(loadingMarkup).not.toContain("xl:grid-cols-4");
    expect(loadingMarkup).not.toContain("2xl:grid-cols-6");
    expect(loadingMarkup.match(/min-h-\[88px\]/g)).toHaveLength(6);
    expect(loadedMarkup.match(/min-h-\[88px\]/g)).toHaveLength(6);
  });

  it("keeps dashboard management cards compact without reducing their content", () => {
    const markup = renderToStaticMarkup(
      <ManagementCard
        data={{
          id: "orders",
          title: "Manage Orders",
          description: "Track current orders and delivery progress.",
          actionLabel: "Manage Orders",
          actionHref: "/orders",
        }}
      />,
    );

    expect(markup).toContain("min-h-44");
    expect(markup).toContain("sm:p-5");
    expect(markup).not.toContain("min-h-52");
    expect(markup).toContain("Track current orders and delivery progress.");
  });
});

describe("shared data patterns", () => {
  it("renders typed table columns and semantic status", () => {
    const markup = renderToStaticMarkup(
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        emptyTitle="No branches"
        sort={{ columnId: "name", direction: "asc" }}
        onSort={() => undefined}
      />,
    );

    expect(markup).toContain('data-slot="data-table"');
    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain("Main Branch");
    expect(markup).toContain('data-slot="status-badge"');
  });

  it("uses the same data and state contract for desktop and mobile", () => {
    const markup = renderToStaticMarkup(
      <ResponsiveDataView
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        emptyTitle="No branches"
        renderMobileItem={(row) => <article>{row.name}</article>}
      />,
    );

    expect(markup).toContain('data-slot="responsive-data-view"');
    expect(markup.match(/Main Branch/g)).toHaveLength(2);
  });

  it("renders consistent empty and error states", () => {
    const emptyMarkup = renderToStaticMarkup(
      <StatePanel title="No branches" description="Add the first branch" />,
    );
    const errorMarkup = renderToStaticMarkup(
      <StatePanel
        state="error"
        title="Could not load branches"
        description="Try again"
      />,
    );

    expect(emptyMarkup).toContain('data-state="empty"');
    expect(errorMarkup).toContain('role="alert"');
  });
});

describe("shared controls", () => {
  it("keeps page tabs and segmented filters on the same non-wrapping control rhythm", () => {
    const tabs = renderToStaticMarkup(
      <PageTabs
        value="overview"
        ariaLabel="Menu views"
        onValueChange={() => undefined}
        options={[
          { value: "overview", label: "Overview" },
          { value: "categories", label: "Categories" },
        ]}
      />,
    );
    const segments = renderToStaticMarkup(
      <SegmentedControl
        value="active"
        ariaLabel="Status"
        onValueChange={() => undefined}
        options={[
          { value: "active", label: "Active cuisines" },
          { value: "inactive", label: "Inactive cuisines" },
        ]}
      />,
    );

    expect(tabs).toContain("whitespace-nowrap");
    expect(segments).toContain("whitespace-nowrap");
    expect(tabs).toContain("bg-[var(--ui-brand-soft)]");
    expect(segments).toContain("bg-[var(--ui-brand-soft)]");
  });

  it("keeps the reset action compact without rendering a redundant search button", () => {
    const markup = renderToStaticMarkup(
      <FilterActions
        resetLabel="Reset"
        onReset={() => undefined}
      />,
    );

    expect(markup).toContain('data-slot="filter-actions"');
    expect(markup).toContain("min-w-[96px]");
    expect(markup).toContain("Reset");
    expect(markup).not.toContain("Search");
  });

  it("keeps the selected segment readable across hover and pressed states", () => {
    const markup = renderToStaticMarkup(
      <SegmentedControl
        value="daily"
        ariaLabel="Revenue range"
        onValueChange={() => undefined}
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
      />,
    );

    expect(markup).toContain('data-slot="segmented-control"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("hover:text-primary");
    expect(markup).toContain("Daily");
  });

  it("keeps pagination windows bounded for large result sets", () => {
    expect(getPaginationItems(1, 3)).toEqual([1, 2, 3]);
    expect(getPaginationItems(50, 100)).toEqual([
      1,
      "ellipsis-start",
      49,
      50,
      51,
      "ellipsis-end",
      100,
    ]);

    const markup = renderToStaticMarkup(
      <PaginationBar
        page={50}
        totalPages={100}
        total={995}
        limit={10}
        onPageChange={() => undefined}
      />,
    );
    expect(markup).toContain('data-slot="pagination-bar"');
    expect(markup).not.toContain(">52<");
  });

  it("keeps an empty result summary at the data footer without page controls", () => {
    const markup = renderToStaticMarkup(
      <PaginationBar page={1} totalPages={1} total={0} limit={10} />,
    );

    expect(markup).toContain('data-slot="pagination-bar"');
    expect(markup).toContain("paginationSummaryEmpty:{&quot;total&quot;:0}");
    expect(markup).not.toContain("<button");
  });

  it("composes shared filters without owning feature state", () => {
    const markup = renderToStaticMarkup(
      <FilterBar
        search={<input aria-label="Search" />}
        filters={<FormSelect aria-label="Status" />}
        actions={<Button>Apply</Button>}
        resultCount="24 results"
      />,
    );

    expect(markup).toContain('data-slot="filter-bar"');
    expect(markup).toContain("24 results");
  });

  it("provides stable form help and error relationships", () => {
    expect(getFormFieldDescriptionId("name", { hasHelp: true })).toBe(
      "name-help",
    );
    expect(
      getFormFieldDescriptionId("name", { hasHelp: true, hasError: true }),
    ).toBe("name-error");

    const markup = renderToStaticMarkup(
      <FormField id="name" label="Name" required error="Name is required">
        <input id="name" aria-describedby="name-error" aria-invalid="true" />
      </FormField>,
    );
    expect(markup).toContain('for="name"');
    expect(markup).toContain('id="name-error"');
    expect(markup).toContain('role="alert"');
  });

  it("exports one filter-sheet and confirmation-dialog contract", () => {
    expect(FilterSheet).toBeTypeOf("function");
    expect(ConfirmDialog).toBeTypeOf("function");
  });
});
