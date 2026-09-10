import type { Key, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { StatePanel } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
};

export type DataTableProps<T> = {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  rowKey: (row: T) => Key;
  loading?: boolean;
  error?: string | null;
  emptyTitle: string;
  emptyDescription?: string;
  errorTitle?: string;
  sort?: { columnId: string; direction: SortDirection };
  onSort?: (columnId: string) => void;
  density?: "default" | "compact";
  selectedRowKeys?: ReadonlySet<Key>;
  onRowClick?: (row: T) => void;
  caption?: string;
  footer?: ReactNode;
  className?: string;
};

const alignmentClassNames = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  error,
  emptyTitle,
  emptyDescription,
  errorTitle = "Unable to load data",
  sort,
  onSort,
  density = "default",
  selectedRowKeys,
  onRowClick,
  caption,
  footer,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <DataTableSkeleton columns={columns.length} density={density} />;
  }

  if (error) {
    return <StatePanel state="error" title={errorTitle} description={error} compact />;
  }

  if (data.length === 0) {
    return (
      <StatePanel
        state="empty"
        title={emptyTitle}
        description={emptyDescription}
        compact
      />
    );
  }

  return (
    <div
      data-slot="data-table"
      data-density={density}
      className={cn(
        "overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)]",
        className,
      )}
    >
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader className="bg-[var(--ui-surface-subtle)]">
          <TableRow>
            {columns.map((column) => {
              const alignment = alignmentClassNames[column.align ?? "left"];
              const activeSort = sort?.columnId === column.id ? sort.direction : null;

              return (
                <TableHead
                  key={column.id}
                  className={cn(
                    "px-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--ui-text-muted)]",
                    alignment,
                    column.headerClassName,
                  )}
                  aria-sort={
                    activeSort === "asc"
                      ? "ascending"
                      : activeSort === "desc"
                        ? "descending"
                        : column.sortable
                          ? "none"
                          : undefined
                  }
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.id)}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-2 rounded-[var(--ui-radius-control)] px-1 font-inherit",
                        alignment === "text-right" && "ml-auto",
                        alignment === "text-center" && "mx-auto",
                      )}
                    >
                      {column.header}
                      {activeSort === "asc" ? (
                        <ArrowUp aria-hidden="true" className="size-3.5" />
                      ) : activeSort === "desc" ? (
                        <ArrowDown aria-hidden="true" className="size-3.5" />
                      ) : (
                        <ChevronsUpDown aria-hidden="true" className="size-3.5" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const key = rowKey(row);
            const isSelected = selectedRowKeys?.has(key) ?? false;

            return (
              <TableRow
                key={key}
                data-state={isSelected ? "selected" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  density === "compact"
                    ? "h-[var(--ui-data-row-compact)]"
                    : "h-[var(--ui-data-row)]",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "px-4 text-[var(--ui-text-muted)]",
                      alignmentClassNames[column.align ?? "left"],
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
    </div>
  );
}

type DataTableSkeletonProps = {
  columns: number;
  rows?: number;
  density?: "default" | "compact";
};

export function DataTableSkeleton({
  columns,
  rows = 6,
  density = "default",
}: DataTableSkeletonProps) {
  return (
    <div
      data-slot="data-table-skeleton"
      role="status"
      aria-label="Loading data"
      className="overflow-hidden rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)]"
    >
      <div className="h-11 animate-pulse bg-[var(--ui-surface-subtle)]" />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "grid animate-pulse items-center gap-4 border-t border-[var(--ui-border)] px-4",
            density === "compact"
              ? "h-[var(--ui-data-row-compact)]"
              : "h-[var(--ui-data-row)]",
          )}
          style={{ gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <span
              key={columnIndex}
              className="h-3.5 max-w-28 rounded bg-neutral-200"
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading data</span>
    </div>
  );
}
