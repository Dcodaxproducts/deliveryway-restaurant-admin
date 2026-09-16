"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaPen, FaTrash } from "react-icons/fa";
import { Search, SlidersHorizontal } from "lucide-react";
import { ModifierGroupModal } from "@/components/pages/Menu/legacy/ModifierGroupModal";
import { ManageGroupModifiersDialog } from "@/components/pages/Menu/modifier-groups/components/ManageGroupModifiersDialog";
import PaginationSection from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { StatePanel } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import { MenuManagementActions } from "@/components/pages/Menu/shared/MenuManagementPage";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  useDeleteModifierGroup,
  useModifierGroups,
} from "@/hooks/useModifierGroups";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import type { ModifierGroup } from "@/types/modifier-groups";

export function ModifierGroupsTableLegacy() {
  const t = useTranslations("menu.modifierGroupsTable");
  const commonT = useTranslations("common");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ModifierGroup | null>(null);
  const [manageGroup, setManageGroup] = useState<ModifierGroup | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  } = useModifierGroups({
    page,
    limit,
    search: debouncedSearch || undefined,
    restaurantId,
  });

  useEffect(() => {
    if (refreshKey) {
      refetch();
    }
  }, [refreshKey, refetch]);

  const { mutate: deleteModifierGroup, isPending: isDeleting } =
    useDeleteModifierGroup();

  const items = useMemo(() => response?.data ?? [], [response?.data]);

  const pagination = useMemo(() => {
    const source = response?.meta;

    const total = Number(source?.total ?? items.length ?? 0);
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);
    const totalPages = Number(
      source?.totalPages ??
        (pageSize > 0 ? Math.ceil(total / pageSize) : 1) ??
        1,
    );

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext: source?.hasNext ?? currentPage < (totalPages || 1),
      hasPrevious: source?.hasPrevious ?? currentPage > 1,
    };
  }, [response, items.length, page, limit]);

  const handleDelete = () => {
    if (!deleteId) return;

    deleteModifierGroup(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        refetch();
      },
    });
  };

  return (
    <div className="w-full">
      <MenuManagementActions>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-primary text-white rounded-[12px] h-[40px] px-4"
        >
          {t("add")}
        </Button>
      </MenuManagementActions>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-[420px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button
          onClick={() => refetch()}
          className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm"
        >
          {commonT("search")}
        </Button>
      </div>

      {isError ? (
        <StatePanel
          state="error"
          title={commonT("unableToLoad")}
          description=""
          compact
          className="mb-4"
          action={
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {commonT("refresh")}
            </Button>
          }
        />
      ) : null}
      {(!isError || items.length > 0) && (
        <ResponsiveDataView
          data={items}
          rowKey={(item) => item.id}
          loading={(isLoading || isFetching) && items.length === 0}
          emptyTitle={t("emptyTitle")}
          columns={[
            {
              id: "name",
              header: commonT("name"),
              cell: (item) => (
                <div className="flex flex-col">
                  <span className="font-medium block">{item.name}</span>
                </div>
              ),
            },
            {
              id: "description",
              header: commonT("description"),
              cell: (item) => (
                <span className="text-gray-500 line-clamp-1">
                  {item.description || "-"}
                </span>
              ),
            },
            {
              id: "selection",
              header: t("minMax"),
              align: "center",
              cell: (item) => `${item.minSelect ?? 0}/${item.maxSelect ?? 0}`,
            },
            {
              id: "modifiers",
              header: t("modifiersCount"),
              align: "center",
              cell: (item) => item.modifiers?.length ?? 0,
            },
            {
              id: "status",
              header: commonT("status"),
              align: "center",
              cell: (item) => (
                <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                  {item.isActive ? commonT("active") : commonT("inactive")}
                </StatusBadge>
              ),
            },
            {
              id: "sort",
              header: t("sort"),
              align: "center",
              cell: (item) => item.sortOrder ?? "-",
            },
            {
              id: "actions",
              header: commonT("actions"),
              align: "center",
              cell: (item) => (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setManageGroup(item)}
                    className="text-gray-500 hover:text-primary"
                    aria-label={t("manageModifiers")}
                  >
                    <SlidersHorizontal size={15} />
                  </button>

                  <button
                    onClick={() => {
                      setSelected(item);
                      setOpen(true);
                    }}
                    aria-label={commonT("edit")}
                    className="text-gray-500 hover:text-primary"
                  >
                    <FaPen size={14} />
                  </button>

                  <button
                    onClick={() => setDeleteId(item.id)}
                    aria-label={commonT("delete")}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          renderMobileItem={(item) => (
            <div
              key={item.id}
              className="rounded-[18px] bg-white p-4 shadow-sm border"
            >
              <div className="flex flex-1 flex-col justify-between gap-3">
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">
                    {item.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {item.description
                      ? item.description.length > 60
                        ? item.description.slice(0, 60) + "..."
                        : item.description
                      : commonT("noData")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <p>
                    {t("minMax")}: {item.minSelect ?? 0}/{item.maxSelect ?? 0}
                  </p>
                  <p>
                    {t("modifiersCount")}: {item.modifiers?.length ?? 0}
                  </p>
                  <p>
                    {t("sort")}: {item.sortOrder ?? "-"}
                  </p>
                  <p>
                    {commonT("status")}:{" "}
                    {item.isActive ? commonT("active") : commonT("inactive")}
                  </p>
                </div>

                <div className="mt-2 flex justify-between items-center">
                  <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                    {item.isActive ? commonT("active") : commonT("inactive")}
                  </StatusBadge>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setManageGroup(item)}
                      className="text-gray-500 hover:text-primary"
                      aria-label={t("manageModifiers")}
                    >
                      <SlidersHorizontal size={15} />
                    </button>

                    <button
                      onClick={() => {
                        setSelected(item);
                        setOpen(true);
                      }}
                      aria-label={commonT("edit")}
                      className="text-gray-500 hover:text-primary"
                    >
                      <FaPen size={14} />
                    </button>

                    <button
                      onClick={() => setDeleteId(item.id)}
                      aria-label={commonT("delete")}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          footer={<PaginationSection {...pagination} onPageChange={setPage} />}
        />
      )}

      {/* EDIT MODAL */}
      <ModifierGroupModal
        open={open}
        onOpenChange={(val: boolean) => {
          setOpen(val);
          if (!val) setSelected(null);
        }}
        initialData={selected}
        refresh={() => {
          setRefreshKey((prev) => prev + 1);
          refetch();
        }}
      />

      <ManageGroupModifiersDialog
        open={!!manageGroup}
        onOpenChange={(value) => {
          if (!value) setManageGroup(null);
        }}
        group={manageGroup}
        restaurantId={restaurantId}
      />

      {/* DELETE */}
      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(value) => {
          if (!value) setDeleteId(null);
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
      />
    </div>
  );
}
