"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaPen, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/pagination";
import { useAuth } from "@/hooks/useAuth";
import { useCuisines, useDeleteCuisine, useReorderCuisines } from "@/hooks/useCuisines";
import { getApiErrorMessage } from "@/lib/errors";
import type { Cuisine } from "@/types/cuisines";
import CuisineDeleteDialog from "@/components/pages/Menu/cuisines/components/CuisineDeleteDialog";
import CuisineFilters from "@/components/pages/Menu/cuisines/components/CuisineFilters";
import CuisineFormDialog from "@/components/pages/Menu/cuisines/components/CuisineFormDialog";
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
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Cuisine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cuisine | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;

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
    restaurantId,
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: "sortOrder",
    sortOrder: "ASC",
    includeInactive: includeInactive || undefined,
  });
  const { mutate: deleteCuisine, isPending: isDeleting } = useDeleteCuisine();
  const { mutate: reorderCuisines, isPending: isReordering } = useReorderCuisines();

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

  const handleDelete = () => {
    if (!deleteTarget) return;

    setDeleteError("");
    deleteCuisine(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => {
        setDeleteError(getApiErrorMessage(error, "Unable to delete cuisine."));
      },
    });
  };

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (cuisine: Cuisine) => {
    setSelected(cuisine);
    setFormOpen(true);
  };

  const moveCuisine = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= cuisines.length) return;

    const reordered = [...cuisines];
    const [moved] = reordered.splice(index, 1);

    if (!moved) return;

    reordered.splice(targetIndex, 0, moved);

    reorderCuisines(
      {
        items: reordered.map((cuisine, nextIndex) => ({
          id: cuisine.id,
          sortOrder: nextIndex,
        })),
      },
      {
        onSuccess: () => void refetch(),
      }
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">Cuisines</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage cuisine tags used to organize menu items.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="h-[40px] rounded-[12px] bg-primary px-4 text-white"
        >
          Add Cuisine
        </Button>
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
        disabled={!restaurantId}
      />

      {!restaurantId ? (
        <div className="mb-4 rounded-[14px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          Restaurant context is required to manage cuisines.
        </div>
      ) : null}

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
              <th className="px-2 text-center">Order</th>
              <th className="px-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
            ) : cuisines.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  No cuisines found
                </td>
              </tr>
            ) : (
              cuisines.map((cuisine, index) => (
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
                  <td className="px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCuisine(index, "up")}
                        disabled={index === 0 || isReordering}
                        className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Move cuisine up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCuisine(index, "down")}
                        disabled={index === cuisines.length - 1 || isReordering}
                        className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Move cuisine down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(cuisine)}
                        className="text-gray-500 hover:text-primary"
                        aria-label="Edit cuisine"
                      >
                        <FaPen size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(cuisine);
                        }}
                        className="text-gray-500 hover:text-red-500"
                        aria-label="Delete cuisine"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
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

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(cuisine)}
                    className="text-gray-500 hover:text-primary"
                    aria-label="Edit cuisine"
                  >
                    <FaPen size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(cuisine);
                    }}
                    className="text-gray-500 hover:text-red-500"
                    aria-label="Delete cuisine"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Sort {formatCuisineSortOrder(cuisine.sortOrder)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveCuisine(cuisines.indexOf(cuisine), "up")}
                    disabled={cuisines.indexOf(cuisine) === 0 || isReordering}
                    className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move cuisine up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCuisine(cuisines.indexOf(cuisine), "down")}
                    disabled={cuisines.indexOf(cuisine) === cuisines.length - 1 || isReordering}
                    className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Move cuisine down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <StatusBadge isActive={cuisine.isActive} />
                </div>
              </div>
            </div>
          ))
        )}

        <PaginationSection {...pagination} onPageChange={setPage} />
      </div>

      <CuisineFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setSelected(null);
        }}
        restaurantId={restaurantId}
        initialData={selected}
      />

      <CuisineDeleteDialog
        cuisine={deleteTarget}
        open={Boolean(deleteTarget)}
        errorMessage={deleteError}
        isLoading={isDeleting}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={handleDelete}
      />
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
      {Array.from({ length: 8 }).map((_, index) => (
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
