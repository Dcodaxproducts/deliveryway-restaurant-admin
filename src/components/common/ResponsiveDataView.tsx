import type { Key, ReactNode } from "react";

import { DataTable, type DataTableProps } from "@/components/common/DataTable";
import { StatePanel } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export type ResponsiveDataViewProps<T> = DataTableProps<T> & {
  renderMobileItem: (row: T) => ReactNode;
  mobileClassName?: string;
  mobileLoading?: ReactNode;
};

export function ResponsiveDataView<T>({
  data,
  rowKey,
  renderMobileItem,
  mobileClassName,
  mobileLoading,
  loading = false,
  error,
  emptyTitle,
  emptyDescription,
  errorTitle,
  footer,
  ...tableProps
}: ResponsiveDataViewProps<T>) {
  return (
    <div data-slot="responsive-data-view">
      <div className="hidden md:block">
        <DataTable
          {...tableProps}
          data={data}
          rowKey={rowKey}
          loading={loading}
          error={error}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          errorTitle={errorTitle}
          footer={undefined}
        />
      </div>

      <div className={cn("space-y-3 md:hidden", mobileClassName)}>
        {loading ? (
          mobileLoading ?? <MobileDataSkeleton />
        ) : error ? (
          <StatePanel
            state="error"
            title={errorTitle ?? "Unable to load data"}
            description={error}
            compact
          />
        ) : data.length === 0 ? (
          <StatePanel
            state="empty"
            title={emptyTitle}
            description={emptyDescription}
            compact
          />
        ) : (
          data.map((row) => <MobileDataItem key={rowKey(row)}>{renderMobileItem(row)}</MobileDataItem>)
        )}
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}

function MobileDataItem({ children }: { children: ReactNode; key?: Key }) {
  return <>{children}</>;
}

function MobileDataSkeleton() {
  return (
    <div role="status" aria-label="Loading data" className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface-subtle)]"
        />
      ))}
      <span className="sr-only">Loading data</span>
    </div>
  );
}
