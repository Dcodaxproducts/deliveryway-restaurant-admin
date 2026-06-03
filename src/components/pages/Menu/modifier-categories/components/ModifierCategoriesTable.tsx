"use client";

import { useEffect, useMemo, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/pagination";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteModifierCategory,
  useModifierCategories,
} from "@/hooks/useModifierCategories";
import { getApiErrorMessage } from "@/lib/errors";
import type { ModifierCategory } from "@/types/modifier-categories";
import ModifierCategoryDeleteDialog from "@/components/pages/Menu/modifier-categories/components/ModifierCategoryDeleteDialog";
import ModifierCategoryFilters from "@/components/pages/Menu/modifier-categories/components/ModifierCategoryFilters";
import ModifierCategoryFormDialog from "@/components/pages/Menu/modifier-categories/components/ModifierCategoryFormDialog";
import {
  formatModifierCategoryDescription,
  formatModifierCategorySortOrder,
  formatModifierCategoryStatus,
} from "@/components/pages/Menu/modifier-categories/utils/modifier-category-formatters";

export default function ModifierCategoriesTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inactive, setInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ModifierCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModifierCategory | null>(
    null
  );
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
  } = useModifierCategories({
    restaurantId,
    page,
    limit,
    search: debouncedSearch || undefined,
    inactive: inactive || undefined,
  });
  const { mutate: deleteCategory, isPending: isDeleting } =
    useDeleteModifierCategory();

  const categories = useMemo(() => response?.data ?? [], [response?.data]);
  const isTableLoading = isLoading || isFetching;

  const pagination = useMemo(() => {
    const source = response?.meta;
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);
    const total = Number(source?.total ?? categories.length);
    const totalPages = Number(source?.totalPages ?? 1);

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext: source?.hasNext ?? currentPage < (totalPages || 1),
      hasPrevious: source?.hasPrevious ?? currentPage > 1,
    };
  }, [categories.length, limit, page, response?.meta]);

  const handleDelete = () => {
    if (!deleteTarget) return;

    setDeleteError("");
    deleteCategory(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => {
        setDeleteError(
          getApiErrorMessage(error, "Unable to delete modifier category.")
        );
      },
    });
  };

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (category: ModifierCategory) => {
    setSelected(category);
    setFormOpen(true);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">
            Modifier Categories
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create categories such as Bread, Sauces, Cheese, and Toppings.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="h-[40px] rounded-[12px] bg-primary px-4 text-white"
        >
          Add Category
        </Button>
      </div>

      <ModifierCategoryFilters
        search={search}
        onSearchChange={setSearch}
        inactive={inactive}
        onInactiveChange={(value) => {
          setInactive(value);
          setPage(1);
        }}
        onSearch={() => void refetch()}
        disabled={!restaurantId}
      />

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-2 py-3">Name</th>
              <th className="px-2">Slug</th>
              <th className="px-2">Description</th>
              <th className="px-2 text-center">Sort Order</th>
              <th className="px-2 text-center">Status</th>
              <th className="px-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  No modifier categories found
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-4 font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-2 text-gray-600">{category.slug || "-"}</td>
                  <td className="px-2 text-gray-600">
                    {formatModifierCategoryDescription(category.description)}
                  </td>
                  <td className="px-2 text-center text-gray-900">
                    {formatModifierCategorySortOrder(category.sortOrder)}
                  </td>
                  <td className="px-2 text-center">
                    <StatusBadge isActive={category.isActive} />
                  </td>
                  <td className="px-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="text-gray-500 hover:text-primary"
                        aria-label="Edit modifier category"
                      >
                        <FaPen size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(category);
                        }}
                        className="text-gray-500 hover:text-red-500"
                        aria-label="Delete modifier category"
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
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : categories.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            No modifier categories found
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="rounded-[18px] border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[16px] font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {category.slug || "-"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatModifierCategoryDescription(category.description)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="text-gray-500 hover:text-primary"
                    aria-label="Edit modifier category"
                  >
                    <FaPen size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(category);
                    }}
                    className="text-gray-500 hover:text-red-500"
                    aria-label="Delete modifier category"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Sort {formatModifierCategorySortOrder(category.sortOrder)}
                </span>
                <StatusBadge isActive={category.isActive} />
              </div>
            </div>
          ))
        )}

        <PaginationSection {...pagination} onPageChange={setPage} />
      </div>

      <ModifierCategoryFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setSelected(null);
        }}
        restaurantId={restaurantId}
        initialData={selected}
      />

      <ModifierCategoryDeleteDialog
        category={deleteTarget}
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
      {formatModifierCategoryStatus(active)}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td colSpan={6} className="py-6">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-4 w-[160px] rounded bg-gray-200" />
          <div className="h-4 w-[120px] rounded bg-gray-200" />
          <div className="h-4 w-[220px] rounded bg-gray-200" />
          <div className="h-4 w-[70px] rounded bg-gray-200" />
          <div className="h-4 w-[70px] rounded bg-gray-200" />
          <div className="h-4 w-[50px] rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[18px] border bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div className="h-4 w-[150px] rounded bg-gray-200" />
        <div className="h-3 w-[90px] rounded bg-gray-200" />
        <div className="h-3 w-[220px] rounded bg-gray-200" />
      </div>
    </div>
  );
}
