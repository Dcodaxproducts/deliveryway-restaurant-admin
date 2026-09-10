"use client";

import { useTranslations } from "next-intl";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export type PaginationMeta = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

type PaginationBarBaseProps = {
  onPageChange?: (page: number) => void;
  className?: string;
};

type PaginationBarMetaProps = PaginationBarBaseProps & {
  meta?: PaginationMeta | null;
};

type PaginationBarFlatProps = PaginationBarBaseProps &
  PaginationMeta & {
    hasNext?: boolean;
    hasPrevious?: boolean;
  };

export type PaginationBarProps = PaginationBarMetaProps | PaginationBarFlatProps;
export type PaginationItemValue = number | "ellipsis-start" | "ellipsis-end";

export function getPaginationItems(
  page: number,
  totalPages: number,
): PaginationItemValue[] {
  if (totalPages <= 7) {
    return Array.from({ length: Math.max(totalPages, 0) }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const visiblePages = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((first, second) => first - second);
  const items: PaginationItemValue[] = [];

  visiblePages.forEach((value, index) => {
    const previous = visiblePages[index - 1];
    if (previous && value - previous > 1) {
      items.push(previous === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    items.push(value);
  });

  return items;
}

function getMeta(props: PaginationBarProps): PaginationMeta | null {
  if ("page" in props) return props;
  return props.meta ?? null;
}

export function PaginationBar(props: PaginationBarProps) {
  const t = useTranslations("common");
  const meta = getMeta(props);
  const onPageChange = props.onPageChange ?? (() => undefined);

  if (!meta || meta.totalPages <= 0) return null;

  const { page, totalPages, total, limit } = meta;
  const hasPrevious = "hasPrevious" in props ? props.hasPrevious ?? page > 1 : page > 1;
  const hasNext =
    "hasNext" in props ? props.hasNext ?? page < totalPages : page < totalPages;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      data-slot="pagination-bar"
      className={cn(
        "flex flex-col items-center justify-between gap-4 border-t border-[var(--ui-border)] pt-4 sm:flex-row",
        props.className,
      )}
    >
      <p className="text-sm tabular-nums text-[var(--ui-text-muted)]">
        {t("paginationSummary", { from, to, total })}
      </p>

      <Pagination className="w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={!hasPrevious}
              tabIndex={hasPrevious ? 0 : -1}
              onClick={() => hasPrevious && onPageChange(page - 1)}
              className={cn(!hasPrevious && "pointer-events-none opacity-45")}
            />
          </PaginationItem>

          <div className="flex rounded-[var(--ui-radius-compact)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-1">
            {getPaginationItems(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === page}
                    aria-label={`Page ${item}`}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationEllipsis aria-hidden="true" />
                </PaginationItem>
              ),
            )}
          </div>

          <PaginationItem>
            <PaginationNext
              aria-disabled={!hasNext}
              tabIndex={hasNext ? 0 : -1}
              onClick={() => hasNext && onPageChange(page + 1)}
              className={cn(!hasNext && "pointer-events-none opacity-45")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default PaginationBar;
