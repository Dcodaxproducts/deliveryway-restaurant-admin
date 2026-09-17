"use client";

import Image from "next/image";
import { Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PaginationSection from "@/components/common/PaginationSection";
import {
  ResponsiveDataView,
} from "@/components/common/ResponsiveDataView";
import type { DataTableColumn } from "@/components/common/DataTable";
import { StatePanel } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useCuisines } from "@/hooks/useCuisines";
import CuisineFilters, {
  type CuisineStatusFilter,
} from "@/components/pages/Menu/cuisines/components/CuisineFilters";
import { formatCuisineDescription } from "@/components/pages/Menu/cuisines/utils/cuisine-formatters";
import type { Cuisine } from "@/types/cuisines";

const DESCRIPTION_PREVIEW_LIMIT = 110;

const getImageUrl = (value?: string | null) => {
  if (typeof value === "string" && value.trim().startsWith("http")) {
    return value.trim();
  }

  return null;
};

const isLongDescription = (value: string) =>
  value.length > DESCRIPTION_PREVIEW_LIMIT || value.split(/\r?\n/).length > 2;

export default function CuisinesTable() {
  const feedbackT = useTranslations("common.feedback");
  const t = useTranslations("common");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CuisineStatusFilter>("active");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useCuisines({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: "createdAt",
    sortOrder: "DESC",
    all: statusFilter === "all" ? true : undefined,
    inactive: statusFilter === "inactive" ? true : undefined,
    includeInactive: statusFilter === "all" ? true : undefined,
  });

  const cuisines = useMemo(() => {
    return [...(response?.data ?? [])].sort((first, second) => {
      const secondCreatedAt = new Date(second.createdAt ?? 0).getTime();
      const firstCreatedAt = new Date(first.createdAt ?? 0).getTime();

      return secondCreatedAt - firstCreatedAt;
    });
  }, [response?.data]);
  const isTableLoading = !response && (isLoading || isFetching);

  const pagination = useMemo(() => {
    const source = response?.meta;
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);
    const total = Number(source?.total ?? cuisines.length);
    const totalPages = Number(source?.totalPages ?? 1);

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext: source?.hasNext ?? currentPage < (totalPages || 1),
      hasPrevious: source?.hasPrevious ?? currentPage > 1,
    };
  }, [cuisines.length, limit, page, response?.meta]);
  const columns = useMemo<readonly DataTableColumn<Cuisine>[]>(
    () => [
      {
        id: "name",
        header: t("name"),
        cell: (cuisine) => <CuisineIdentity cuisine={cuisine} />,
      },
      {
        id: "description",
        header: t("description"),
        cell: (cuisine) => <DescriptionWithTooltip value={cuisine.description} />,
        className: "max-w-[420px]",
      },
      {
        id: "status",
        header: t("status"),
        cell: (cuisine) => <CuisineStatusBadge isActive={cuisine.isActive} />,
        align: "center",
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <CuisineFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
      />
      {isError && response ? (
        <StatePanel state="error" title={feedbackT("refreshFailed", { subject: feedbackT("subjects.cuisines") })} description={feedbackT("cachedDescription")} compact />
      ) : null}
      <ResponsiveDataView
        data={cuisines}
        columns={columns}
        rowKey={(cuisine) => cuisine.id}
        loading={isTableLoading}
        error={isError && !response ? feedbackT("loadFailedDescription") : null}
        errorTitle={feedbackT("loadFailed", { subject: feedbackT("subjects.cuisines") })}
        emptyTitle={t("noCuisinesFound")}
        renderMobileItem={(cuisine) => (
          <article className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-[var(--ui-shadow-xs)]">
            <div className="flex items-start justify-between gap-3">
              <CuisineIdentity cuisine={cuisine} />
              <CuisineStatusBadge isActive={cuisine.isActive} />
            </div>
            <div className="mt-3 text-sm text-[var(--ui-text-muted)]">
              <DescriptionWithTooltip value={cuisine.description} />
            </div>
          </article>
        )}
        footer={<PaginationSection {...pagination} onPageChange={setPage} />}
      />
      {isError ? <Button type="button" variant="outline" disabled={isFetching} onClick={() => void refetch()}>{feedbackT("retry", { subject: feedbackT("subjects.cuisines") })}</Button> : null}
    </div>
  );
}

function CuisineIdentity({ cuisine }: { cuisine: Cuisine }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <CuisineImage cuisine={cuisine} />
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900">{cuisine.name}</div>
      </div>
    </div>
  );
}

function CuisineImage({ cuisine }: { cuisine: Cuisine }) {
  const src = getImageUrl(cuisine.imageUrl);

  if (!src) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Layers3 size={18} />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <Image
        src={src}
        alt={cuisine.name}
        fill
        sizes="48px"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}

function DescriptionWithTooltip({ value }: { value?: string | null }) {
  const description = formatCuisineDescription(value);
  const shouldShowTooltip =
    description !== "-" && isLongDescription(description);

  return (
    <span
      className="group relative inline-block max-w-full align-top"
      tabIndex={shouldShowTooltip ? 0 : -1}
    >
      <span className="block max-w-full overflow-hidden whitespace-pre-line break-words text-sm leading-5 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
        {description}
      </span>
      {shouldShowTooltip ? (
        <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-72 rounded-xl border border-gray-200 bg-white p-3 text-left text-xs leading-5 text-gray-700 shadow-xl group-hover:block group-focus:block">
          {description}
        </span>
      ) : null}
    </span>
  );
}

function CuisineStatusBadge({ isActive }: { isActive?: boolean }) {
  const t = useTranslations("common");
  const active = isActive !== false;

  return (
    <StatusBadge tone={active ? "success" : "neutral"}>
      {active ? t("active") : t("inactive")}
    </StatusBadge>
  );
}
