"use client";

import { useEffect, useMemo, useState } from "react";
import PaginationSection from "@/components/common/pagination";
import { useCuisines } from "@/hooks/useCuisines";
import CuisineFilters from "@/components/pages/Menu/cuisines/components/CuisineFilters";
import {
  formatCuisineDescription,
  formatCuisineSortOrder,
  formatCuisineStatus,
} from "@/components/pages/Menu/cuisines/utils/cuisine-formatters";

export default function CuisinesTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

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
    sortBy: "sortOrder",
    sortOrder: "ASC",
    includeInactive: includeInactive || undefined,
  });

  const cuisines = useMemo(() => response?.data ?? [], [response?.data]);
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
          <h2 className="text-[18px] font-semibold text-gray-900">Cuisines</h2>
          <p className="mt-1 text-sm text-gray-500">
            View global cuisine tags available for menu items.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Read-only
        </span>
      </div>

      <CuisineFilters
        search={search}
        onSearchChange={setSearch}
        includeInactive={includeInactive}
        onIncludeInactiveChange={(value) => {
          setIncludeInactive(value);
          setPage(1);
        }}
        onSearch={() => void refetch()}
      />

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-2 py-3">Name</th>
              <th className="px-2">Slug</th>
              <th className="px-2">Description</th>
              <th className="px-2">Image</th>
              <th className="px-2 text-center">Sort Order</th>
              <th className="px-2 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
            ) : cuisines.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  No cuisines found
                </td>
              </tr>
            ) : (
              cuisines.map((cuisine) => (
                <tr key={cuisine.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-4 font-medium text-gray-900">
                    {cuisine.name}
                  </td>
                  <td className="px-2 text-gray-600">{cuisine.slug || "-"}</td>
                  <td className="px-2 text-gray-600">
                    {formatCuisineDescription(cuisine.description)}
                  </td>
                  <td className="px-2 text-gray-600">
                    {cuisine.imageUrl ? (
                      <a
                        href={cuisine.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-2 text-center text-gray-900">
                    {formatCuisineSortOrder(cuisine.sortOrder)}
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
          Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
        ) : cuisines.length === 0 ? (
          <div className="py-10 text-center text-gray-400">No cuisines found</div>
        ) : (
          cuisines.map((cuisine) => (
            <div key={cuisine.id} className="rounded-[18px] border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-semibold text-gray-900">
                    {cuisine.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {cuisine.slug || "-"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatCuisineDescription(cuisine.description)}
                  </p>
                </div>

                <StatusBadge isActive={cuisine.isActive} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Sort {formatCuisineSortOrder(cuisine.sortOrder)}
                </span>
                {cuisine.imageUrl ? (
                  <a
                    href={cuisine.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View image
                  </a>
                ) : null}
              </div>
            </div>
          ))
        )}

        <PaginationSection {...pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  const active = isActive !== false;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {formatCuisineStatus(active)}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b">
      {Array.from({ length: 6 }).map((_, index) => (
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
      <div className="h-5 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="mt-5 h-4 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}
