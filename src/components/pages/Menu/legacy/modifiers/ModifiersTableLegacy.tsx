"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaPen, FaTrash } from "react-icons/fa";
import ModifierModal from "@/components/pages/Menu/legacy/ModifierModal";
import ModifierCategoryInfiniteSelect from "@/components/pages/Menu/modifiers/components/ModifierCategoryInfiniteSelect";
import PaginationSection from "@/components/common/PaginationSection";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { StatePanel } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import { Copy, MoreVertical, Search } from "lucide-react";
import { useDuplicateModifier } from "@/hooks/useMenus";
import { useDeleteModifier, useModifiers } from "@/hooks/useModifiers";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslations } from "next-intl";
import type { Modifier } from "@/types/modifiers";

export default function ModifiersTable() {
  const t = useTranslations("menu.modifiersTable");
  const commonT = useTranslations("common");
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;
  const { formatMoney } = useCurrency(restaurantId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Modifier | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categoryId, setCategoryId] = useState("");

  const [openActionId, setOpenActionId] = useState<string | null>(null);

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
  } = useModifiers({
    page,
    limit,
    search: debouncedSearch || undefined,
    restaurantId,
    categoryId: categoryId || undefined,
  });

  useEffect(() => {
    if (refreshKey) {
      refetch();
    }
  }, [refreshKey, refetch]);

  const { mutate: deleteModifier, isPending: isDeleting } = useDeleteModifier();

  const { mutate: duplicateModifier, isPending: isDuplicating } =
    useDuplicateModifier();

  const items = useMemo(() => response?.data ?? [], [response?.data]);

  const pagination = useMemo(() => {
    const source = response?.meta;
    const total = Number(source?.total ?? items.length);
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);
    const totalPages = Number(source?.totalPages ?? 1);

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

    deleteModifier(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        refetch();
      },
    });
  };

  const handleDuplicate = (modifierId: string) => {
    duplicateModifier(modifierId, {
      onSuccess: () => {
        setOpenActionId(null);
        refetch();
      },
    });
  };

  const isTableLoading = (isLoading || isFetching) && items.length === 0;

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="h-[40px] rounded-[12px] bg-primary px-4 text-white"
        >
          {t("add")}
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
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

        <div className="w-full max-w-[360px]">
          <ModifierCategoryInfiniteSelect
            value={categoryId}
            onChange={(value) => {
              setCategoryId(value);
              setPage(1);
            }}
            restaurantId={restaurantId}
            placeholder={t("categoryFilterPlaceholder")}
            disabled={!restaurantId}
            allowClear
          />
        </div>

        <Button
          onClick={() => refetch()}
          disabled={!restaurantId}
          className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm disabled:opacity-60"
        >
          {commonT("search")}
        </Button>
      </div>

      {isError ? (
        <StatePanel state="error" title={commonT("unableToLoad")} description="" compact className="mb-4"
          action={<Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>{commonT("refresh")}</Button>} />
      ) : null}
      {(!isError || items.length > 0) && <ResponsiveDataView
        data={items}
        rowKey={(item) => item.id}
        loading={isTableLoading}
        emptyTitle={t("emptyTitle")}
        columns={[
          {
            id: "name", header: commonT("name"), cell: (item) => (
              <div className="flex flex-col">
                <span className="block font-medium text-gray-900">
                  {item.name || "-"}
                </span>
              </div>
            )
          },
          { id: "category", header: t("category"), align: "center", cell: (item) => item.category?.name || t("uncategorized") },
          { id: "price", header: t("basePrice"), align: "center", cell: (item) => formatMoney(item.priceDelta) },
          {
            id: "status", header: commonT("status"), align: "center", cell: (item) => (
              <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                {item.isActive ? commonT("active") : commonT("inactive")}
              </StatusBadge>
            )
          },
          {
            id: "actions", header: commonT("actions"), align: "center", cell: (item) => (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setOpen(true);
                  }}
                  className="text-gray-500 hover:text-primary"
                  aria-label={t("editAria")}
                >
                  <FaPen size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteId(item.id)}
                  className="text-gray-500 hover:text-red-500"
                  aria-label={t("deleteAria")}
                >
                  <FaTrash size={14} />
                </button>

                <ActionDropdown
                  item={item}
                  isOpen={!isMobile && openActionId === item.id}
                  isDuplicating={isDuplicating}
                  onToggle={() =>
                    setOpenActionId((prev) =>
                      prev === item.id ? null : item.id
                    )
                  }
                  onClose={() => setOpenActionId(null)}
                  onDuplicate={handleDuplicate}
                />
              </div>
            )
          },
        ]}
        renderMobileItem={(item) => (
          <div
            key={item.id}
            className="rounded-[18px] border bg-white p-4 shadow-sm"
          >
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">
                  {item.name || "-"}
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {item.category?.name || t("uncategorized")}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {formatMoney(item.priceDelta)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                  {item.isActive ? commonT("active") : commonT("inactive")}
                </StatusBadge>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setOpen(true);
                    }}
                    className="text-gray-500 hover:text-primary"
                    aria-label={t("editAria")}
                  >
                    <FaPen size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="text-gray-500 hover:text-red-500"
                    aria-label={t("deleteAria")}
                  >
                    <FaTrash size={14} />
                  </button>

                  <ActionDropdown
                    item={item}
                    isOpen={isMobile && openActionId === item.id}
                    isDuplicating={isDuplicating}
                    onToggle={() =>
                      setOpenActionId((prev) =>
                        prev === item.id ? null : item.id
                      )
                    }
                    onClose={() => setOpenActionId(null)}
                    onDuplicate={handleDuplicate}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        footer={<PaginationSection {...pagination} onPageChange={setPage} />}
      />}

      <ModifierModal
        open={open}
        onOpenChange={(value: boolean) => {
          setOpen(value);
          if (!value) setSelected(null);
        }}
        initialData={selected}
        refresh={() => {
          setRefreshKey((prev) => prev + 1);
          refetch();
        }}
      />

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

function ActionDropdown({
  item,
  isOpen,
  isDuplicating,
  onToggle,
  onClose,
  onDuplicate,
}: {
  item: Modifier;
  isOpen: boolean;
  isDuplicating: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDuplicate: (modifierId: string) => void;
}) {
  const t = useTranslations("menu.modifiersTable");

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => open ? onToggle() : onClose()} modal={false}>
      <DropdownMenuTrigger asChild>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        aria-label={t("actionsAria")}
      >
        <MoreVertical size={17} />
      </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[160px] rounded-[12px] border-gray-100 bg-white py-1 text-left shadow-lg">
          <button
            type="button"
            disabled={isDuplicating}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              if (isDuplicating) return;

              onDuplicate(item.id);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy size={15} />
            {isDuplicating ? t("duplicating") : t("duplicate")}
          </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
