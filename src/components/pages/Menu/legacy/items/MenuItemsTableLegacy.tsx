"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterActions } from "@/components/common/FilterActions";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import CategoryInfiniteSelect from "@/components/common/CategoryInfiniteSelect";
import { FaPen, FaTrash } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteMenuItem,
  useDuplicateMenuItem,
  useGetMenuItems,
  useReorderMenuItems,
  useUpsertMenuItemBranchOverride,
} from "@/hooks/useMenus";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  Copy,
  Filter,
  GripVertical,
  ImageOff,
  Loader2,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react";
import { SearchField } from "@/components/common/SearchField";
import CreateMenuItemModal from "@/components/pages/Menu/legacy/root-menu-components/CreateMenuItemModal/CreateMenuItemModal";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useIsMobile } from "@/hooks/use-mobile";
import InfiniteScrollFooter from "@/components/common/infinite-scroll-footer";
import { useClickOutside } from "@/hooks/useClickOutside";
import { formatMoney } from "@/lib/currency";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import { useTranslations } from "next-intl";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { StatePanel } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { updateMenuItem } from "@/services/menus";
import { getApiErrorMessage } from "@/lib/errors";
import MenuItemStatusControl from "@/components/pages/Menu/items/components/MenuItemsTable/MenuItemStatusControl";
import {
  getMenuItemActive,
  updateMenuItemStatus,
} from "@/components/pages/Menu/items/components/MenuItemsTable/menu-item-status";

const PAGE_LIMIT = 10;

type MenuItemStatusFilter = "active" | "inactive";

function MenuItemThumbnail({
  imageUrl,
  name,
  size,
}: {
  imageUrl?: string | null;
  name: string;
  size: "small" | "large";
}) {
  const [failed, setFailed] = useState(false);
  const normalizedImageUrl = imageUrl?.trim() || "";

  useEffect(() => {
    setFailed(false);
  }, [normalizedImageUrl]);

  const sizeClass =
    size === "small"
      ? "h-10 w-10 rounded-[10px]"
      : "h-20 w-20 rounded-[14px]";

  if (!normalizedImageUrl || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center border border-dashed border-gray-200 bg-gray-50 text-gray-300 ${sizeClass}`}
        role="img"
        aria-label={`${name} has no image`}
      >
        <ImageOff size={size === "small" ? 16 : 24} strokeWidth={1.7} />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden border ${sizeClass}`}>
      <Image
        src={normalizedImageUrl}
        alt={name}
        fill
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

const STATUS_FILTER_OPTIONS: Array<{
  value: MenuItemStatusFilter;
}> = [
  {
    value: "active",
  },
  {
    value: "inactive",
  },
];

const getItemDisplayPrice = (item: any, variationBasedLabel: string) => {
  const override =
    item?.branchOverride || item?.branchOverrides?.[0] || item?.overrides?.[0];
  const rawPrice =
    override?.price ??
    override?.overridePrice ??
    item?.price ??
    item?.basePrice;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return {
      hasPrice: false,
      label: variationBasedLabel,
    };
  }

  const numericPrice = Number(rawPrice);

  if (Number.isNaN(numericPrice)) {
    return {
      hasPrice: false,
      label: variationBasedLabel,
    };
  }

  return {
    hasPrice: true,
    label: formatCurrency(numericPrice),
  };
};

const mergeUniqueById = (prev: any[], next: any[]) => {
  const map = new Map<string, any>();

  [...prev, ...next].forEach((item) => {
    const id = String(item?.id || "");
    if (!id) return;
    map.set(id, item);
  });

  return Array.from(map.values());
};

export default function MenuItemsTable({ refetchKey }: any) {
  const t = useTranslations("menu.itemsTable");
  const commonT = useTranslations("common");
  const {
    restaurantId,
    branchId,
    isBranchAdmin,
  } = useAuth();

  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStatusItemIdsRef = useRef<Set<string>>(new Set());

  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_LIMIT);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MenuItemStatusFilter>("active");
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const [allItems, setAllItems] = useState<any[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [overrideItem, setOverrideItem] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState({
    isAvailable: true,
    price: "",
    reason: "",
  });
  const [pendingStatusItemIds, setPendingStatusItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const isMobile = useIsMobile();

  const canFetchItems = Boolean(restaurantId);

  const activeStatusOption = useMemo(
    () =>
      STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) ||
      STATUS_FILTER_OPTIONS[0],
    [statusFilter],
  );

  const getStatusLabel = (value: MenuItemStatusFilter) =>
    value === "active" ? commonT("active") : commonT("inactive");
  const getStatusHelper = (value: MenuItemStatusFilter) =>
    value === "active" ? t("onlyActiveItems") : t("onlyInactiveItems");

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search.trim() ||
      debouncedSearch ||
      statusFilter !== "active" ||
      categoryId,
    );
  }, [search, debouncedSearch, statusFilter, categoryId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim();

      setPage(1);
      setDebouncedSearch(nextSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const menuItemQueryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      restaurantId: restaurantId || undefined,
      categoryId,
      inactive: statusFilter === "inactive" ? true : undefined,
      sortBy: "sortOrder" as const,
      sortOrder: "ASC" as const,
    }),
    [page, limit, debouncedSearch, restaurantId, categoryId, statusFilter],
  );

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        restaurantId: restaurantId || "",
        branchId: branchId || "",
        isBranchAdmin,
        search: debouncedSearch || "",
        statusFilter,
        categoryId: categoryId || "",
        limit,
      }),
    [restaurantId, branchId, isBranchAdmin, debouncedSearch, statusFilter, categoryId, limit],
  );
  const [previousQuerySignature, setPreviousQuerySignature] = useState(querySignature);

  // Reset before children commit: rows are reusable only within one query identity.
  if (previousQuerySignature !== querySignature) {
    setPreviousQuerySignature(querySignature);
    setAllItems([]);
    setHasLoadedOnce(false);
    setPage(1);
  }

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMenuItems(menuItemQueryParams);

  const { mutate: deleteMenuItem, isPending: isDeleting } = useDeleteMenuItem();

  const { mutate: duplicateMenuItem, isPending: isDuplicating } =
    useDuplicateMenuItem();

  const { mutate: reorderItems, isPending: isReordering } =
    useReorderMenuItems();

  const { mutate: saveItemOverride, isPending: isSavingOverride } =
    useUpsertMenuItemBranchOverride();

  const fetchedItems = useMemo<any[] | null>(() => {
    return extractResponseItems(response);
  }, [response]);

  const meta = useMemo(() => {
    return extractResponseMeta(response);
  }, [response]);

  const pagination = useMemo(() => {
    const currentPage = Number(meta?.page ?? page);
    const pageSize = Number(meta?.limit ?? limit);
    const total = Number(meta?.total ?? 0);

    const totalPages = Number(
      meta?.totalPages ??
        meta?.pages ??
        (total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 0),
    );

    return {
      page: currentPage,
      limit: pageSize || limit,
      total,
      totalPages,
      hasNext:
        typeof meta?.hasNext === "boolean"
          ? meta.hasNext
          : typeof meta?.hasMore === "boolean"
            ? meta.hasMore
            : total > 0
              ? allItems.length < total
              : Boolean(fetchedItems && fetchedItems.length >= pageSize),
      hasPrevious:
        typeof meta?.hasPrevious === "boolean"
          ? meta.hasPrevious
          : currentPage > 1,
    };
  }, [meta, page, limit, allItems.length, fetchedItems]);

  const hasMore = useMemo(() => {
    if (!canFetchItems || !hasLoadedOnce || isError) return false;

    if (pagination.total > 0) {
      return allItems.length < pagination.total;
    }

    return Boolean(pagination.hasNext);
  }, [
    canFetchItems,
    hasLoadedOnce,
    isError,
    pagination.total,
    pagination.hasNext,
    allItems.length,
  ]);

  const shouldShowInitialLoader =
    !canFetchItems ||
    (!hasLoadedOnce && !isError && allItems.length === 0) ||
    ((isLoading || isFetching) && page === 1 && allItems.length === 0);

  const shouldShowEmpty =
    canFetchItems &&
    hasLoadedOnce &&
    !isLoading &&
    !isFetching &&
    allItems.length === 0;

  useEffect(() => {
    if (!canFetchItems || fetchedItems === null || isFetching || isError) return;

    setHasLoadedOnce(true);

    setAllItems((prev) => {
      if (page === 1) {
        return fetchedItems;
      }

      return mergeUniqueById(prev, fetchedItems);
    });
  }, [fetchedItems, page, canFetchItems, isFetching, isError, querySignature]);

  const resetAndFetchFirstPage = useCallback(() => {
    setPage((prev) => {
      if (prev === 1) {
        refetch();
      }

      return 1;
    });
  }, [refetch]);

  useEffect(() => {
    if (!restaurantId) return;

    setAllItems([]);
    setHasLoadedOnce(false);
    resetAndFetchFirstPage();
  }, [restaurantId, branchId, isBranchAdmin, resetAndFetchFirstPage]);

  useEffect(() => {
    if (!refetchKey) return;

    resetAndFetchFirstPage();
  }, [refetchKey, resetAndFetchFirstPage]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isFetching || isLoading) return;

    setPage((prev) => {
      if (pagination.totalPages > 0 && prev >= pagination.totalPages) {
        return prev;
      }

      return prev + 1;
    });
  }, [hasMore, isFetching, isLoading, pagination.totalPages]);

  const desktopLoadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled:
      !isMobile && canFetchItems && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const mobileLoadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: isMobile && canFetchItems && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const handleDelete = () => {
    if (!deleteId) return;

    deleteMenuItem(deleteId, {
      onSuccess: () => {
        setAllItems((prev) =>
          prev.filter((item) => String(item.id) !== String(deleteId)),
        );

        setDeleteId(null);
        setOpenActionId(null);
        refetch();
      },
    });
  };

  const handleDuplicate = (menuItemId: string) => {
    duplicateMenuItem(menuItemId, {
      onSuccess: () => {
        setOpenActionId(null);
        resetAndFetchFirstPage();
      },
    });
  };

  const handleEdit = (item: any) => {
    if (isBranchAdmin) {
      handleOverrideOpen(item);
      return;
    }

    setSelected(item);
    setOpen(true);
    setOpenActionId(null);
  };

  const getBranchOverride = (item: any) =>
    item?.branchOverride ||
    item?.branchOverrides?.[0] ||
    item?.overrides?.[0] ||
    null;

  const handleOverrideOpen = (item: any) => {
    const override = getBranchOverride(item);
    const overridePrice =
      override?.price ??
      override?.overridePrice ??
      item?.price ??
      item?.basePrice;

    setOverrideItem(item);
    setOverrideForm({
      isAvailable: Boolean(
        override?.isAvailable ?? item?.isAvailable ?? item?.isActive ?? true,
      ),
      price:
        overridePrice === null ||
        overridePrice === undefined ||
        overridePrice === ""
          ? ""
          : String(overridePrice),
      reason: override?.reason || "",
    });
    setOpenActionId(null);
  };

  const handleSaveOverride = () => {
    if (!branchId || !overrideItem?.id) return;

    saveItemOverride(
      {
        branchId,
        menuItemId: overrideItem.id,
        isAvailable: overrideForm.isAvailable,
        price:
          overrideForm.price === "" || overrideForm.price === null
            ? undefined
            : Number(overrideForm.price),
        reason: overrideForm.reason || undefined,
      },
      {
        onSuccess: () => {
          setOverrideItem(null);
          resetAndFetchFirstPage();
        },
      },
    );
  };

  const handleDeleteOpen = (itemId: string) => {
    setDeleteId(itemId);
    setOpenActionId(null);
  };

  const buildReorderPayload = (items: any[]) => ({
    ...(categoryId ? { categoryId } : {}),
    items: items.map((item, index) => ({
      id: String(item.id),
      sortOrder: index + 1,
    })),
  });

  const persistReorder = (items: any[]) => {
    if (isBranchAdmin) return;
    if (reorderTimerRef.current) {
      clearTimeout(reorderTimerRef.current);
    }

    reorderTimerRef.current = setTimeout(() => {
      reorderItems(buildReorderPayload(items), {
        onError: () => {
          refetch();
        },
      });
    }, 500);
  };

  const moveItem = (fromId: string, toId: string) => {
    if (isBranchAdmin) return;
    if (fromId === toId) return;

    setAllItems((prev) => {
      const fromIndex = prev.findIndex(
        (item) => String(item.id) === String(fromId),
      );

      const toIndex = prev.findIndex(
        (item) => String(item.id) === String(toId),
      );

      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }

      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);

      const normalized = updated.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
      }));

      persistReorder(normalized);

      return normalized;
    });
  };

  const handleDragStart = (id: string) => {
    if (isBranchAdmin) return;
    setDraggedId(id);
  };

  const handleDrop = (targetId: string) => {
    if (isBranchAdmin || !draggedId) return;

    moveItem(draggedId, targetId);
    setDraggedId(null);
  };

  const softRefresh = () => {
    resetAndFetchFirstPage();
  };

  const handleStatusChange = (value: MenuItemStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleItemStatusChange = async (item: any, isActive: boolean) => {
    const itemId = String(item?.id || "");
    if (
      !itemId ||
      isBranchAdmin ||
      pendingStatusItemIdsRef.current.has(itemId)
    ) {
      return;
    }

    pendingStatusItemIdsRef.current.add(itemId);
    setPendingStatusItemIds((previous) => {
      const next = new Set(previous);
      next.add(itemId);
      return next;
    });

    try {
      await updateMenuItemStatus({
        item,
        restaurantId: restaurantId || undefined,
        isActive,
        update: updateMenuItem,
      });

      setAllItems((previous) =>
        previous
          .map((currentItem) =>
            String(currentItem.id) === itemId
              ? { ...currentItem, isActive }
              : currentItem,
          )
          .filter((currentItem) => {
            if (String(currentItem.id) !== itemId) return true;
            return statusFilter === "active" ? isActive : !isActive;
          }),
      );
      toast.success(
        t(isActive ? "statusActivatedSuccess" : "statusDeactivatedSuccess", {
          name: item.name || t("thisItem"),
        }),
      );
      void refetch();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("statusUpdateFailed")));
    } finally {
      pendingStatusItemIdsRef.current.delete(itemId);
      setPendingStatusItemIds((previous) => {
        const next = new Set(previous);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleCategoryChange = (nextCategoryId: string | undefined) => {
    setCategoryId(nextCategoryId);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("active");
    setCategoryId(undefined);
    setPage(1);

    if (!hasActiveFilters) {
      refetch();
    }
  };

  // DataTable owns the rows; delegate domain drag events without another table shell.
  const desktopItem = (target: EventTarget) => {
    const row = (target as Element).closest<HTMLTableRowElement>("tbody tr");
    return row ? allItems[row.sectionRowIndex] : undefined;
  };

  return (
    <div className="w-full">
      <div className="mb-6 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <Filter size={18} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("filtersTitle")}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("filtersDescription")}{" "}
                <span className="font-medium text-gray-700">
                  {getStatusHelper(activeStatusOption.value)}
                </span>
              </p>
            </div>
          </div>

          {isFetching && !shouldShowInitialLoader ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Loader2 size={12} className="animate-spin" />
              {commonT("refreshing")}
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-12 2xl:items-end">
          <div className="min-w-0 2xl:col-span-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("search")}
            </label>

            <div>
              <SearchField
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                disabled={!canFetchItems}
                className="bg-[var(--ui-surface-subtle)]"
              />
            </div>
          </div>

          <div className="min-w-0 2xl:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("status")}
            </label>

            <SegmentedControl
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS.map((option) => ({
                value: option.value,
                label: getStatusLabel(option.value),
              }))}
              onValueChange={handleStatusChange}
              ariaLabel={commonT("status")}
              disabled={!canFetchItems}
              size="default"
              className="w-full"
            />
          </div>

          <div className="min-w-0 2xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              {commonT("category")}
            </label>

            <CategoryInfiniteSelect
              value={categoryId}
              onChange={handleCategoryChange}
              restaurantId={restaurantId || undefined}
              branchId={branchId || undefined}
              disabled={!canFetchItems}
            />
          </div>

          <FilterActions
            resetLabel={commonT("reset")}
            onReset={handleResetFilters}
            resetDisabled={!canFetchItems || (!hasActiveFilters && !isFetching)}
            className="md:col-span-2 2xl:col-span-3"
          />
        </div>
      </div>

      {isReordering && !isBranchAdmin ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          {t("savingOrder")}
        </div>
      ) : null}

      <div
        onDragStart={(event) => {
          const item = desktopItem(event.target);
          if (item) handleDragStart(item.id);
        }}
        onDragOver={(event) => {
          if (!isBranchAdmin && desktopItem(event.target)) event.preventDefault();
        }}
        onDrop={(event) => {
          const item = desktopItem(event.target);
          if (item) handleDrop(item.id);
        }}
        onDragEnd={() => setDraggedId(null)}
      >
        {isError ? (
          <StatePanel state="error" title={commonT("unableToLoad")} description="" compact className="mb-4"
            action={<Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>{commonT("refresh")}</Button>} />
        ) : null}
        {(!isError || allItems.length > 0) && <ResponsiveDataView
          data={allItems}
          rowKey={(item) => item.id}
          loading={shouldShowInitialLoader || (isFetching && allItems.length === 0)}
          emptyTitle={hasActiveFilters ? t("emptyFiltered") : t("emptyTitle")}
          className="[&_tr:has([data-dragged=true])]:bg-primary/5 [&_tr:has([data-dragged=true])]:opacity-60"
          columns={[
            {
              id: "order", header: "", align: "center", cell: (item) => (
                <div
                  data-dragged={draggedId === item.id}
                  ref={(node) => {
                    const row = node?.closest("tr");
                    if (row) row.draggable = !isBranchAdmin;
                  }}
                >
                  {isBranchAdmin ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                      {t("scoped")}
                    </span>
                  ) : (
                    <div className="flex cursor-grab justify-center text-gray-400 active:cursor-grabbing">
                      <GripVertical size={18} />
                    </div>
                  )}
                </div>
              )
            },
            {
              id: "item", header: t("item"), cell: (item) => (
                <div className="flex items-center gap-3">
                  <MenuItemThumbnail
                    imageUrl={item.imageUrl}
                    name={item.name || t("imageAlt")}
                    size="small"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {item.name}
                    </p>

                    {item.description ? (
                      <p className="mt-1 max-w-[220px] truncate text-[11px] text-gray-400">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            },
            { id: "category", header: commonT("category"), cell: (item) => item.category?.name || item.categoryName || "-" },
            {
              id: "price", header: commonT("price"), align: "center", cell: (item) => (
                <>
                  {(() => {
                    const price = getItemDisplayPrice(
                      item,
                      t("variationBased"),
                    );

                    return (
                      <span
                        className={
                          price.hasPrice
                            ? "text-gray-900"
                            : "rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
                        }
                      >
                        {price.label}
                      </span>
                    );
                  })()}
                </>
              )
            },
            { id: "prep", header: t("prep"), align: "center", cell: (item) => t("prepMinutes", { minutes: item.prepTimeMinutes ?? "-" }) },
            {
              id: "status", header: commonT("status"), align: "center", cell: (item) => (
                <MenuItemStatusControl
                  active={getMenuItemActive(item)}
                  pending={pendingStatusItemIds.has(String(item.id))}
                  disabled={isBranchAdmin}
                  activeLabel={commonT("active")}
                  inactiveLabel={commonT("inactive")}
                  ariaLabel={t(
                    getMenuItemActive(item)
                      ? "deactivateAriaLabel"
                      : "activateAriaLabel",
                    { name: item.name || t("thisItem") },
                  )}
                  pendingLabel={t("statusUpdating", {
                    name: item.name || t("thisItem"),
                  })}
                  disabledReason={
                    isBranchAdmin ? t("statusBranchAdminDisabled") : undefined
                  }
                  onCheckedChange={(checked) =>
                    void handleItemStatusChange(item, checked)
                  }
                />
              )
            },
            {
              id: "actions", header: commonT("actions"), align: "center", cell: (item) => (
                <ActionDropdown
                  item={item}
                  isOpen={openActionId === item.id}
                  isDuplicating={isDuplicating}
                  onToggle={() =>
                    setOpenActionId((prev) =>
                      prev === item.id ? null : item.id,
                    )
                  }
                  onClose={() => setOpenActionId(null)}
                  onDuplicate={handleDuplicate}
                  onEdit={handleEdit}
                  onDelete={handleDeleteOpen}
                  isBranchAdmin={isBranchAdmin}
                  onOverride={handleOverrideOpen}
                />
              )
            },
          ]}
          renderMobileItem={(item) => (
            <div
              key={item.id}
              draggable={!isBranchAdmin}
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => !isBranchAdmin && e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              onDragEnd={() => setDraggedId(null)}
              className={`rounded-[18px] border bg-white p-4 shadow-sm transition ${draggedId === item.id ? "bg-primary/5 opacity-60" : ""
                }`}
            >
              <div className="mb-3 flex items-center justify-between">
                {isBranchAdmin ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    {t("scopedBranch")}
                  </span>
                ) : (
                  <div className="flex cursor-grab items-center gap-1 text-xs text-gray-400 active:cursor-grabbing">
                    <GripVertical size={16} />
                    {t("drag")}
                  </div>
                )}

                <ActionDropdown
                  item={item}
                  isOpen={openActionId === item.id}
                  isDuplicating={isDuplicating}
                  onToggle={() =>
                    setOpenActionId((prev) =>
                      prev === item.id ? null : item.id,
                    )
                  }
                  onClose={() => setOpenActionId(null)}
                  onDuplicate={handleDuplicate}
                  onEdit={handleEdit}
                  onDelete={handleDeleteOpen}
                  isBranchAdmin={isBranchAdmin}
                  onOverride={handleOverrideOpen}
                />
              </div>

              <div className="flex gap-4">
                <MenuItemThumbnail
                  imageUrl={item.imageUrl}
                  name={item.name || t("imageAlt")}
                  size="large"
                />

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-gray-900">
                      {item.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {item.category?.name || item.categoryName || "-"}
                    </p>

                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-2 flex justify-between">
                    {(() => {
                      const price = getItemDisplayPrice(
                        item,
                        t("variationBased"),
                      );

                      return (
                        <span
                          className={
                            price.hasPrice
                              ? "font-semibold text-primary"
                              : "rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
                          }
                        >
                          {price.label}
                        </span>
                      );
                    })()}

                    <span className="text-xs text-gray-400">
                      {t("prepMinutes", {
                        minutes: item.prepTimeMinutes ?? "-",
                      })}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <MenuItemStatusControl
                      active={getMenuItemActive(item)}
                      pending={pendingStatusItemIds.has(String(item.id))}
                      disabled={isBranchAdmin}
                      activeLabel={commonT("active")}
                      inactiveLabel={commonT("inactive")}
                      ariaLabel={t(
                        getMenuItemActive(item)
                          ? "deactivateAriaLabel"
                          : "activateAriaLabel",
                        { name: item.name || t("thisItem") },
                      )}
                      pendingLabel={t("statusUpdating", {
                        name: item.name || t("thisItem"),
                      })}
                      disabledReason={
                        isBranchAdmin ? t("statusBranchAdminDisabled") : undefined
                      }
                      onCheckedChange={(checked) =>
                        void handleItemStatusChange(item, checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          footer={!isError && !shouldShowInitialLoader && !shouldShowEmpty && allItems.length > 0 ? (
            <>
              <div className="hidden md:block">
                <InfiniteScrollFooter
                  loadMoreRef={desktopLoadMoreRef}
                  isFetching={isFetching && page > 1}
                  hasMore={hasMore}
                  total={pagination.total}
                  shown={allItems.length}
                  label="menu items"
                  onLoadMore={handleLoadMore}
                />
              </div>
              <div className="md:hidden">
                <InfiniteScrollFooter
                  loadMoreRef={mobileLoadMoreRef}
                  isFetching={isFetching && page > 1}
                  hasMore={hasMore}
                  total={pagination.total}
                  shown={allItems.length}
                  label="menu items"
                  onLoadMore={handleLoadMore}
                />
              </div>
            </>
          ) : null}
        />}
      </div>

      {overrideItem ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("overrideTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("overrideDescription", {
                  name: overrideItem?.name || t("thisItem"),
                })}
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-[14px] border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                {t("availableInBranch")}
                <input
                  type="checkbox"
                  checked={overrideForm.isAvailable}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({
                      ...prev,
                      isAvailable: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("branchPrice")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overrideForm.price}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  placeholder={t("branchPricePlaceholder")}
                  className="h-[44px] w-full rounded-[14px] border border-gray-200 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  {t("reasonNote")}
                </label>
                <textarea
                  value={overrideForm.reason}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({
                      ...prev,
                      reason: event.target.value,
                    }))
                  }
                  placeholder={t("optionalBranchNote")}
                  className="min-h-[92px] w-full rounded-[14px] border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideItem(null)}
              >
                {commonT("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSaveOverride}
                disabled={isSavingOverride || !branchId}
              >
                {isSavingOverride ? commonT("saving") : t("saveOverride")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <CreateMenuItemModal
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setSelected(null);
          }
        }}
        initialData={selected}
        onSuccess={softRefresh}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteId(null);
          }
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
  onEdit,
  onDelete,
  isBranchAdmin = false,
  onOverride,
}: {
  item: any;
  isOpen: boolean;
  isDuplicating: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDuplicate: (menuItemId: string) => void;
  onEdit: (item: any) => void;
  onDelete: (menuItemId: string) => void;
  isBranchAdmin?: boolean;
  onOverride?: (item: any) => void;
}) {
  const t = useTranslations("menu.itemsTable");
  const commonT = useTranslations("common");
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) {
      onClose();
    }
  });

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const dropdownWidth = 170;
    const dropdownHeight = 122;
    const gap = 8;
    const viewportPadding = 8;

    const buttonRect = buttonRef.current.getBoundingClientRect();

    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    const shouldOpenUpward =
      spaceBelow < dropdownHeight + gap && spaceAbove > dropdownHeight + gap;

    const top = shouldOpenUpward
      ? buttonRect.top - dropdownHeight - gap
      : buttonRect.bottom + gap;

    const left = Math.min(
      Math.max(viewportPadding, buttonRect.right - dropdownWidth),
      window.innerWidth - dropdownWidth - viewportPadding,
    );

    setDropdownPosition({
      top: Math.max(viewportPadding, top),
      left,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  return (
    <div ref={dropdownRef} className="relative flex justify-center">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-label={t("actionsAriaLabel")}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <MoreVertical size={17} />
      </button>

      {isOpen ? (
        <div
          className="fixed z-[9999] w-[170px] overflow-hidden rounded-[12px] border border-gray-100 bg-white py-1 text-left shadow-lg"
          style={{
            top: dropdownPosition?.top ?? 0,
            left: dropdownPosition?.left ?? 0,
            visibility: dropdownPosition ? "visible" : "hidden",
          }}
        >
          {isBranchAdmin ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOverride?.(item);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <SlidersHorizontal size={15} />
              {t("branchOverride")}
            </button>
          ) : (
            <>
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

              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEdit(item);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <FaPen size={13} />
                {commonT("edit")}
              </button>

              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(item.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <FaTrash size={13} />
                {commonT("delete")}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function formatCurrency(value: any) {
  const numeric = Number(value ?? 0);

  if (Number.isNaN(numeric)) {
    return formatMoney(0);
  }

  return formatMoney(numeric);
}
