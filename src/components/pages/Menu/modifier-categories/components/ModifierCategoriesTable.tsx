"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaPen, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { MenuManagementActions } from "@/components/pages/Menu/shared/MenuManagementPage";
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
} from "@/components/pages/Menu/modifier-categories/utils/modifier-category-formatters";

export default function ModifierCategoriesTable() {
  const t = useTranslations("common");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inactive, setInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ModifierCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModifierCategory | null>(
    null,
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
    isError,
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
          getApiErrorMessage(error, t("deleteModifierCategoryFailed")),
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
      <MenuManagementActions>
        <Button
          onClick={openCreate}
          className="h-[40px] rounded-[12px] bg-primary px-4 text-white"
        >
          {t("addCategory")}
        </Button>
      </MenuManagementActions>

      <ModifierCategoryFilters
        search={search}
        onSearchChange={setSearch}
        inactive={inactive}
        onInactiveChange={(value) => {
          setInactive(value);
          setPage(1);
        }}
        disabled={!restaurantId}
      />

      <ResponsiveDataView
        data={categories}
        rowKey={(category) => category.id}
        loading={isTableLoading}
        error={isError ? t("unableToLoad") : null}
        errorTitle={t("modifierCategories")}
        emptyTitle={t("noModifierCategoriesFound")}
        emptyDescription=""
        columns={[
          {
            id: "name",
            header: t("name"),
            className: "font-medium text-gray-900",
            cell: (category) => category.name,
          },
          {
            id: "slug",
            header: t("slug"),
            cell: (category) => category.slug || "-",
          },
          {
            id: "description",
            header: t("description"),
            className: "min-w-[200px] max-w-sm whitespace-normal",
            cell: (category) =>
              formatModifierCategoryDescription(category.description),
          },
          {
            id: "sort",
            header: t("sortOrder"),
            align: "center",
            cell: (category) =>
              formatModifierCategorySortOrder(category.sortOrder),
          },
          {
            id: "status",
            header: t("status"),
            align: "center",
            cell: (category) => <StatusBadge isActive={category.isActive} />,
          },
          {
            id: "actions",
            header: t("actions"),
            align: "center",
            cell: (category) => (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(category)}
                  className="text-gray-500 hover:text-primary"
                  aria-label={t("editModifierCategory")}
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
                  aria-label={t("deleteModifierCategory")}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ),
          },
        ]}
        renderMobileItem={(category) => (
          <div
            key={category.id}
            className="rounded-[var(--ui-radius-card)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
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
                  aria-label={t("editModifierCategory")}
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
                  aria-label={t("deleteModifierCategory")}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t("sortValue", {
                  value: formatModifierCategorySortOrder(category.sortOrder),
                })}
              </span>
              <StatusBadge isActive={category.isActive} />
            </div>
          </div>
        )}
        footer={<PaginationSection {...pagination} onPageChange={setPage} />}
      />

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
