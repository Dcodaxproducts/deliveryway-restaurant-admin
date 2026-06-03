"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  Loader2,
  MoreVertical,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import CreateMenuItemModal from "@/components/pages/Menu/legacy/root-menu-components/CreateMenuItemModal/CreateMenuItemModal";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import InfiniteScrollFooter from "@/components/common/infinite-scroll-footer";
import { useClickOutside } from "@/hooks/useClickOutside";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";

const PAGE_LIMIT = 10;

type MenuItemStatusFilter = "active" | "inactive";

const STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: MenuItemStatusFilter;
  helper: string;
}> = [
  {
    label: "Active",
    value: "active",
    helper: "Only active items",
  },
  {
    label: "Inactive",
    value: "inactive",
    helper: "Only inactive items",
  },
];

const getItemDisplayPrice = (item: any) => {
  const override = item?.branchOverride || item?.branchOverrides?.[0] || item?.overrides?.[0];
  const rawPrice = override?.price ?? override?.overridePrice ?? item?.price ?? item?.basePrice;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return {
      hasPrice: false,
      label: "Variation based",
    };
  }

  const numericPrice = Number(rawPrice);

  if (Number.isNaN(numericPrice)) {
    return {
      hasPrice: false,
      label: "Variation based",
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
  const { user, restaurantId: authRestaurantId, branchId, isBranchAdmin } = useAuth();

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? user?.tenantId ?? "";

  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const querySignatureRef = useRef<string>("");

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

  const canFetchItems = Boolean(restaurantId);

  const activeStatusOption = useMemo(
    () =>
      STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter) ||
      STATUS_FILTER_OPTIONS[0],
    [statusFilter]
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search.trim() ||
        debouncedSearch ||
        statusFilter !== "active" ||
        categoryId
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
    }),
    [page, limit, debouncedSearch, restaurantId, categoryId, statusFilter]
  );

  const querySignature = useMemo(
    () =>
      JSON.stringify({
        restaurantId: restaurantId || "",
        search: debouncedSearch || "",
        statusFilter,
        categoryId: categoryId || "",
      }),
    [restaurantId, debouncedSearch, statusFilter, categoryId]
  );

  useEffect(() => {
    if (!canFetchItems) return;
    if (querySignatureRef.current === querySignature) return;

    querySignatureRef.current = querySignature;
    setAllItems([]);
    setHasLoadedOnce(false);
    setPage(1);
  }, [querySignature, canFetchItems]);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetMenuItems(menuItemQueryParams);

  const { mutate: deleteMenuItem, isPending: isDeleting } =
    useDeleteMenuItem();

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
        (total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 0)
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
    if (!canFetchItems || !hasLoadedOnce) return false;

    if (pagination.total > 0) {
      return allItems.length < pagination.total;
    }

    return Boolean(pagination.hasNext);
  }, [
    canFetchItems,
    hasLoadedOnce,
    pagination.total,
    pagination.hasNext,
    allItems.length,
  ]);

  const shouldShowInitialLoader =
    !canFetchItems ||
    (!hasLoadedOnce && allItems.length === 0) ||
    ((isLoading || isFetching) && page === 1 && allItems.length === 0);

  const shouldShowEmpty =
    canFetchItems &&
    hasLoadedOnce &&
    !isLoading &&
    !isFetching &&
    allItems.length === 0;

  useEffect(() => {
    if (!canFetchItems || fetchedItems === null) return;

    setHasLoadedOnce(true);

    setAllItems((prev) => {
      if (page === 1) {
        return fetchedItems;
      }

      return mergeUniqueById(prev, fetchedItems);
    });
  }, [fetchedItems, page, canFetchItems]);

  const resetAndFetchFirstPage = useCallback(() => {
    setAllItems([]);
    setHasLoadedOnce(false);

    setPage((prev) => {
      if (prev === 1) {
        refetch();
      }

      return 1;
    });
  }, [refetch]);

  useEffect(() => {
    if (!restaurantId) return;

    resetAndFetchFirstPage();
  }, [restaurantId, resetAndFetchFirstPage]);

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
    enabled: canFetchItems && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const mobileLoadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: canFetchItems && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const handleDelete = () => {
    if (!deleteId) return;

    deleteMenuItem(deleteId, {
      onSuccess: () => {
        setAllItems((prev) =>
          prev.filter((item) => String(item.id) !== String(deleteId))
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
    const overridePrice = override?.price ?? override?.overridePrice ?? item?.price ?? item?.basePrice;

    setOverrideItem(item);
    setOverrideForm({
      isAvailable: Boolean(override?.isAvailable ?? item?.isAvailable ?? item?.isActive ?? true),
      price:
        overridePrice === null || overridePrice === undefined || overridePrice === ""
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
      }
    );
  };

  const handleDeleteOpen = (itemId: string) => {
    setDeleteId(itemId);
    setOpenActionId(null);
  };

  const buildReorderPayload = (items: any[]) => ({
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
        (item) => String(item.id) === String(fromId)
      );

      const toIndex = prev.findIndex(
        (item) => String(item.id) === String(toId)
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

  const handleManualSearch = () => {
    if (!canFetchItems) return;

    const nextSearch = search.trim();

    setPage(1);
    setDebouncedSearch(nextSearch);

    if (page === 1 && debouncedSearch === nextSearch) {
      refetch();
    }
  };

  const handleStatusChange = (value: MenuItemStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
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

  const SkeletonRow = () => (
    <tr>
      <td colSpan={7} className="py-6">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-gray-200" />
          <div className="h-4 w-[120px] rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-[18px] border bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-[14px] bg-gray-200" />

        <div className="flex-1 space-y-3">
          <div className="h-4 w-[140px] rounded bg-gray-200" />
          <div className="h-3 w-[100px] rounded bg-gray-200" />
          <div className="h-3 w-[80px] rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );

  const EmptyTableState = () => (
    <div className="py-10 text-center text-gray-400">
      No menu items found
      {hasActiveFilters ? " for the selected filters" : ""}
    </div>
  );

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
                Menu Item Filters
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Filter menu items by keyword and active status. Current view:{" "}
                <span className="font-medium text-gray-700">
                  {activeStatusOption.helper}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              Showing {allItems.length}
              {pagination.total > 0 ? ` of ${pagination.total}` : ""}
            </span>

            {isFetching && !shouldShowInitialLoader ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                <Loader2 size={12} className="animate-spin" />
                Refreshing
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px_260px_auto_auto] lg:items-end">
          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                placeholder="Search by item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleManualSearch();
                  }
                }}
                className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Status
            </label>

            <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-[#F7F7F7] p-1">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    disabled={!canFetchItems}
                    className={`h-[38px] rounded-[11px] px-3 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white text-primary shadow-sm ring-1 ring-primary/10"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Category
            </label>

            <CategoryInfiniteSelect
              value={categoryId}
              onChange={handleCategoryChange}
              restaurantId={restaurantId || undefined}
              branchId={branchId || undefined}
              disabled={!canFetchItems}
            />
          </div>

          <Button
            type="button"
            disabled={!canFetchItems}
            onClick={handleManualSearch}
            className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90"
          >
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!canFetchItems || (!hasActiveFilters && !isFetching)}
            onClick={handleResetFilters}
            className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700"
          >
            <RefreshCcw size={15} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {isReordering && !isBranchAdmin ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Saving item order...
        </div>
      ) : null}

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="w-[48px] px-2 py-3"></th>
              <th className="px-2 py-3">Item</th>
              <th className="px-2">Category</th>
              <th className="px-2 text-center">Price</th>
              <th className="px-2 text-center">Prep</th>
              <th className="px-2 text-center">Status</th>
              <th className="px-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {shouldShowInitialLoader ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : shouldShowEmpty ? (
              <tr>
                <td colSpan={7}>
                  <EmptyTableState />
                </td>
              </tr>
            ) : (
              allItems.map((item: any) => (
                <tr
                  key={item.id}
                  draggable={!isBranchAdmin}
                  onDragStart={() => handleDragStart(item.id)}
                  onDragOver={(e) => !isBranchAdmin && e.preventDefault()}
                  onDrop={() => handleDrop(item.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`border-b transition-colors hover:bg-gray-50 ${
                    draggedId === item.id ? "bg-primary/5 opacity-60" : ""
                  }`}
                >
                  <td className="px-2 py-4">
                    {isBranchAdmin ? (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Scoped</span>
                    ) : (
                      <div className="flex cursor-grab justify-center text-gray-400 active:cursor-grabbing">
                        <GripVertical size={18} />
                      </div>
                    )}
                  </td>

                  <td className="px-2 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || "https://via.placeholder.com/40"}
                        alt={item.name || "Menu item"}
                        className="h-10 w-10 rounded-[10px] border object-cover"
                        loading="lazy"
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
                  </td>

                  <td className="px-2">
                    {item.category?.name || item.categoryName || "-"}
                  </td>

                  <td className="px-2 text-center font-medium">
                    {(() => {
                      const price = getItemDisplayPrice(item);

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
                  </td>

                  <td className="px-2 text-center">
                    {item.prepTimeMinutes ?? "-"} min
                  </td>

                  <td className="px-2 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        (item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive) ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-2 text-center">
                    <ActionDropdown
                      item={item}
                      isOpen={openActionId === item.id}
                      isDuplicating={isDuplicating}
                      onToggle={() =>
                        setOpenActionId((prev) =>
                          prev === item.id ? null : item.id
                        )
                      }
                      onClose={() => setOpenActionId(null)}
                      onDuplicate={handleDuplicate}
                      onEdit={handleEdit}
                      onDelete={handleDeleteOpen}
                      isBranchAdmin={isBranchAdmin}
                      onOverride={handleOverrideOpen}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!shouldShowInitialLoader && !shouldShowEmpty && allItems.length > 0 ? (
          <InfiniteScrollFooter
            loadMoreRef={desktopLoadMoreRef}
            isFetching={isFetching && page > 1}
            hasMore={hasMore}
            total={pagination.total}
            shown={allItems.length}
            label="menu items"
          />
        ) : null}
      </div>

      <div className="space-y-4 md:hidden">
        {shouldShowInitialLoader ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : shouldShowEmpty ? (
          <div className="py-10 text-center text-gray-400">
            No menu items found
            {hasActiveFilters ? " for the selected filters" : ""}
          </div>
        ) : (
          allItems.map((item: any) => (
            <div
              key={item.id}
              draggable={!isBranchAdmin}
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => !isBranchAdmin && e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              onDragEnd={() => setDraggedId(null)}
              className={`rounded-[18px] border bg-white p-4 shadow-sm transition ${
                draggedId === item.id ? "bg-primary/5 opacity-60" : ""
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                {isBranchAdmin ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Scoped branch</span>
                ) : (
                  <div className="flex cursor-grab items-center gap-1 text-xs text-gray-400 active:cursor-grabbing">
                    <GripVertical size={16} />
                    Drag
                  </div>
                )}

                <ActionDropdown
                  item={item}
                  isOpen={openActionId === item.id}
                  isDuplicating={isDuplicating}
                  onToggle={() =>
                    setOpenActionId((prev) =>
                      prev === item.id ? null : item.id
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
                <img
                  src={item.imageUrl || "https://via.placeholder.com/80"}
                  alt={item.name || "Menu item"}
                  className="h-20 w-20 rounded-[14px] object-cover"
                  loading="lazy"
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
                      const price = getItemDisplayPrice(item);

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
                      {item.prepTimeMinutes ?? "-"} min
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        (item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive) ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {!shouldShowInitialLoader && !shouldShowEmpty && allItems.length > 0 ? (
          <InfiniteScrollFooter
            loadMoreRef={mobileLoadMoreRef}
            isFetching={isFetching && page > 1}
            hasMore={hasMore}
            total={pagination.total}
            shown={allItems.length}
            label="menu items"
          />
        ) : null}
      </div>

      {overrideItem ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Branch item override</h3>
              <p className="mt-1 text-sm text-gray-500">
                Override availability and price for {overrideItem?.name || "this item"} in your assigned branch.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-[14px] border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                Available in branch
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
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Branch price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overrideForm.price}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                  placeholder="Leave empty to use restaurant price"
                  className="h-[44px] w-full rounded-[14px] border border-gray-200 px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Reason / note</label>
                <textarea
                  value={overrideForm.reason}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Optional branch note"
                  className="min-h-[92px] w-full rounded-[14px] border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOverrideItem(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveOverride} disabled={isSavingOverride || !branchId}>
                {isSavingOverride ? "Saving..." : "Save override"}
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
        title="Delete Menu Item"
        description="Are you sure you want to delete this menu item? This action cannot be undone."
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
      window.innerWidth - dropdownWidth - viewportPadding
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
        aria-label="Menu item actions"
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
              Branch Override
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
            {isDuplicating ? "Duplicating..." : "Duplicate"}
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
            Edit
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
            Delete
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
    return "$0.00";
  }

  return `$${numeric.toFixed(2)}`;
}
