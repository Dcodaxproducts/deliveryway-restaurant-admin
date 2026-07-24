"use client";

import Image from "next/image";
import { Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import PaginationSection from "@/components/common/pagination";
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
  const isTableLoading = isLoading || isFetching;

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

  return (
    <div className="w-full">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">
            {t("cuisines")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("cuisinesDescription")}
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {t("readOnly")}
        </span>
      </div>

      <CuisineFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        onSearch={() => void refetch()}
      />

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-2 py-3">{t("name")}</th>
              <th className="px-2">{t("description")}</th>
              <th className="px-2 text-center">{t("status")}</th>
            </tr>
          </thead>

          <tbody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : cuisines.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-gray-400">
                  {t("noCuisinesFound")}
                </td>
              </tr>
            ) : (
              cuisines.map((cuisine) => (
                <tr key={cuisine.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <CuisineIdentity cuisine={cuisine} />
                  </td>
                  <td className="max-w-[420px] px-2 text-gray-600">
                    <DescriptionWithTooltip value={cuisine.description} />
                  </td>
                  <td className="px-2 text-center">
                    <StatusBadge isActive={cuisine.isActive} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-4 px-2 pb-2">
          <PaginationSection {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {isTableLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : cuisines.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            {t("noCuisinesFound")}
          </div>
        ) : (
          cuisines.map((cuisine) => (
            <div
              key={cuisine.id}
              className="rounded-[18px] border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <CuisineIdentity cuisine={cuisine} />
                <StatusBadge isActive={cuisine.isActive} />
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <DescriptionWithTooltip value={cuisine.description} />
              </div>
            </div>
          ))
        )}

        <PaginationSection {...pagination} onPageChange={setPage} />
      </div>
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

function StatusBadge({ isActive }: { isActive?: boolean }) {
  const t = useTranslations("common");
  const active = isActive !== false;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {active ? t("active") : t("inactive")}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b">
      {Array.from({ length: 3 }).map((_, index) => (
        <td key={index} className="px-2 py-4">
          <div className="h-4 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[18px] border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="mt-5 h-4 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}
