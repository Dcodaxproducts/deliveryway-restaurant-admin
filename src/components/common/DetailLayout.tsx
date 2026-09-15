import type { HTMLAttributes, ReactNode } from "react";

import { SectionCard, type SectionCardProps } from "@/components/common/SectionCard";
import { cn } from "@/lib/utils";

export type DetailLayoutProps = HTMLAttributes<HTMLDivElement> & {
  summary?: ReactNode;
  aside?: ReactNode;
};

export function DetailLayout({
  summary,
  aside,
  children,
  className,
  ...props
}: DetailLayoutProps) {
  return (
    <div data-slot="detail-layout" className={cn("min-w-0 space-y-5", className)} {...props}>
      {summary ? <div data-slot="detail-layout-summary">{summary}</div> : null}
      <div
        data-slot="detail-layout-body"
        className={cn(
          "grid min-w-0 gap-5",
          aside && "xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-start",
        )}
      >
        <div data-slot="detail-layout-main" className="min-w-0 space-y-5">
          {children}
        </div>
        {aside ? (
          <aside data-slot="detail-layout-aside" className="min-w-0 space-y-5 xl:sticky xl:top-24">
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export type DetailPanelProps = SectionCardProps;

export function DetailPanel({ variant = "outlined", ...props }: DetailPanelProps) {
  return <SectionCard data-slot="detail-panel" variant={variant} {...props} />;
}

export type InfoListItem = {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  hidden?: boolean;
};

export type InfoListProps = Omit<HTMLAttributes<HTMLDListElement>, "children"> & {
  items: readonly InfoListItem[];
  columns?: 1 | 2 | 3;
  emptyValue?: ReactNode;
};

const infoColumnsClass: Record<NonNullable<InfoListProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
};

export function InfoList({
  items,
  columns = 2,
  emptyValue = "—",
  className,
  ...props
}: InfoListProps) {
  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <dl
      data-slot="info-list"
      className={cn("grid min-w-0 gap-x-6 gap-y-5", infoColumnsClass[columns], className)}
      {...props}
    >
      {visibleItems.map((item) => (
        <div key={item.id} data-slot="info-list-item" className="flex min-w-0 items-start gap-3">
          {item.icon ? (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[var(--ui-radius-control)] bg-[var(--ui-brand-soft)] text-primary [&_svg]:size-4">
              {item.icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--ui-text-subtle)]">
              {item.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-[var(--ui-text)]">
              {item.value === null || item.value === undefined || item.value === ""
                ? emptyValue
                : item.value}
            </dd>
            {item.description ? (
              <dd className="mt-1 text-xs font-normal leading-5 text-[var(--ui-text-muted)]">
                {item.description}
              </dd>
            ) : null}
          </div>
        </div>
      ))}
    </dl>
  );
}
