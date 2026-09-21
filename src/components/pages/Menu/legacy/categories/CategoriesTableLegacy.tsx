"use client";

import { FormSelect } from "@/components/ui/form-select";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaPen, FaTrash } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteMenuCategory,
  useGetMenuCategories,
  useReorderMenuCategories,
  useUpdateMenuCategory,
  useUpsertMenuCategoryBranchOverride,
} from "@/hooks/useMenuCategories";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  Eye,
  GripVertical,
  Loader2,
  MoreVertical,
  SlidersHorizontal,
} from "lucide-react";
import { SearchField } from "@/components/common/SearchField";
import CreateCategoryModalParent from "@/components/pages/Menu/legacy/root-menu-components/listing/CreateCategoryModalParent";
import { useRouter } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import InfiniteScrollFooter from "@/components/common/infinite-scroll-footer";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";
import { useTranslations } from "next-intl";
import { ResponsiveDataView } from "@/components/common/ResponsiveDataView";
import { StatePanel } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/status-badge";
import { FilterBar } from "@/components/common/FilterBar";

const PAGE_LIMIT = 100;

const mergeUniqueById = (prev: any[], next: any[]) => {
  const map = new Map<string, any>();

  [...prev, ...next].forEach((item) => {
    const id = String(item?.id || "");
    if (!id) return;
    map.set(id, item);
  });

  return Array.from(map.values());
};

export default function CategoriesTable({ refetchKey }: any) {
  const t = useTranslations("menu.categories");
  const commonT = useTranslations("common");
  const { restaurantId, branchId, isBranchAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  const router = useRouter();

  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_LIMIT);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [allItems, setAllItems] = useState<any[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState({
    isAvailable: true,
    reason: "",
  });

  const canFetchCategories = Boolean(restaurantId);

  const querySignature = JSON.stringify({
    restaurantId: restaurantId || "",
    branchId: branchId || "",
    isBranchAdmin,
    search: debouncedSearch || "",
    statusFilter,
    sortOrder,
    limit,
  });
  const [previousQuerySignature, setPreviousQuerySignature] = useState(querySignature);

  // Reset before children commit: rows are reusable only within one query identity.
  if (previousQuerySignature !== querySignature) {
    setPreviousQuerySignature(querySignature);
    setAllItems([]);
    setHasLoadedOnce(false);
    setPage(1);
  }

  /**
   * Important:
   * Do not clear allItems inside debounce.
   * On initial mount, the empty search debounce can fire after the first
   * successful API response and wipe the list.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = search.trim();

      setPage(1);
      setDebouncedSearch(nextSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMenuCategories({
    page,
    limit,
    search: debouncedSearch || undefined,
    restaurantId: restaurantId || undefined,
    sortBy: "sortOrder",
    sortOrder: "ASC",

    // only include inactive when "all" selected
    includeInactive: statusFilter === "all",

    inactive: statusFilter === "all" ? undefined : statusFilter === "inactive",
  });

  const { mutate: deleteMenuCategory, isPending: isDeleting } =
    useDeleteMenuCategory();

  const { mutate: reorderCategories, isPending: isReordering } =
    useReorderMenuCategories();
  const { mutate: updateCategoryStatus } = useUpdateMenuCategory();
  const { mutate: saveCategoryOverride, isPending: isSavingOverride } =
    useUpsertMenuCategoryBranchOverride();
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
    if (!canFetchCategories || !hasLoadedOnce || isError) return false;

    if (pagination.total > 0) {
      return allItems.length < pagination.total;
    }

    return Boolean(pagination.hasNext);
  }, [
    canFetchCategories,
    hasLoadedOnce,
    isError,
    pagination.total,
    pagination.hasNext,
    allItems.length,
  ]);

  const shouldShowInitialLoader =
    !canFetchCategories ||
    (!hasLoadedOnce && !isError && allItems.length === 0) ||
    ((isLoading || isFetching) && page === 1 && allItems.length === 0);

  const shouldShowEmpty =
    canFetchCategories &&
    hasLoadedOnce &&
    !isLoading &&
    !isFetching &&
    allItems.length === 0;

  useEffect(() => {
    if (!canFetchCategories || fetchedItems === null || isFetching || isError) return;

    setHasLoadedOnce(true);

    setAllItems((prev) => {
      if (page === 1) {
        return fetchedItems;
      }

      return mergeUniqueById(prev, fetchedItems);
    });
  }, [fetchedItems, page, canFetchCategories, isFetching, isError, querySignature]);

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

  useEffect(() => {
    return () => {
      if (reorderTimerRef.current) {
        clearTimeout(reorderTimerRef.current);
      }
    };
  }, []);

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
    enabled: canFetchCategories && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const mobileLoadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: canFetchCategories && hasMore && !isFetching && !isLoading,
    onLoadMore: handleLoadMore,
  });

  const handleDelete = () => {
    if (!deleteId) return;

    deleteMenuCategory(deleteId, {
      onSuccess: () => {
        setAllItems((prev) =>
          prev.filter((item) => String(item.id) !== String(deleteId)),
        );

        setDeleteId(null);
        refetch();
      },
    });
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
      reorderCategories(buildReorderPayload(items), {
        onError: () => {
          refetch();
        },
      });
    }, 500);
  };

  const moveItem = (fromId: string, toId: string) => {
    if (isBranchAdmin || fromId === toId) return;

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

  const getBranchCategoryOverride = (item: any) =>
    item?.branchOverride ||
    item?.branchOverrides?.[0] ||
    item?.overrides?.[0] ||
    null;

  const handleOverrideOpen = (item: any) => {
    const override = getBranchCategoryOverride(item);

    setOverrideCategory(item);
    setOverrideForm({
      isAvailable: Boolean(
        override?.isAvailable ?? item?.isAvailable ?? item?.isActive ?? true,
      ),
      reason: override?.reason || "",
    });
  };

  const handleSaveOverride = () => {
    if (!branchId || !overrideCategory?.id) return;

    saveCategoryOverride(
      {
        branchId,
        categoryId: overrideCategory.id,
        isAvailable: overrideForm.isAvailable,
        reason: overrideForm.reason || undefined,
      },
      {
        onSuccess: () => {
          setOverrideCategory(null);
          resetAndFetchFirstPage();
        },
      },
    );
  };

  const softRefresh = () => {
    resetAndFetchFirstPage();
  };

  // DataTable owns the rows; delegate domain drag events without another table shell.
  const desktopItem = (target: EventTarget) => {
    const row = (target as Element).closest<HTMLTableRowElement>("tbody tr");
    return row ? allItems[row.sectionRowIndex] : undefined;
  };

  return (
    <div className="w-full">
      <FilterBar
        className="mb-6"
        search={
          <SearchField
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            disabled={!canFetchCategories}
            className="bg-[var(--ui-surface-subtle)]"
          />
        }
        filters={
          <FormSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 min-w-[12rem] rounded-[var(--ui-radius-control)] border-[var(--ui-border)] bg-[var(--ui-surface-subtle)] px-3 text-sm sm:w-56"
          >
            <option value="all">{t("statusOptions.all")}</option>
            <option value="active">{commonT("inactive")}</option>
          </FormSelect>
        }
      />

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
          emptyTitle={t("emptyTitle")}
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
              id: "category", header: commonT("category"), cell: (item) => (
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl || "https://via.placeholder.com/40"}
                    alt={item.name || t("imageAlt")}
                    className="h-10 w-10 rounded-[10px] border object-cover"
                    loading="lazy"
                  />

                  <div className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.name}
                    </span>

                    {item.description ? (
                      <span className="line-clamp-1 text-xs text-gray-400">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            },
            {
              id: "description", header: commonT("description"), className: "max-w-[220px]", cell: (item) => (
                <>
                  {item.description ? (
                    <span className="block truncate text-sm text-gray-600">
                      {item.description.length > 40
                        ? `${item.description.slice(0, 40)}...`
                        : item.description}
                    </span>
                  ) : (
                    "-"
                  )}
                </>
              )
            },
            { id: "slug", header: commonT("slug"), align: "center", cell: (item) => item.slug || "-" },
            {
              id: "status", header: commonT("status"), align: "center", cell: (item) => (
                <StatusBadge tone={(item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive) ? "success" : "neutral"}>
                  {(item.branchOverride?.isAvailable ??
                    item.branchOverrides?.[0]?.isAvailable ??
                    item.isAvailable ??
                    item.isActive)
                    ? commonT("active")
                    : commonT("inactive")}
                </StatusBadge>
              )
            },
            {
              id: "actions", header: commonT("actions"), align: "center", cell: (item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                      type="button"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-[180px]">
                    {isBranchAdmin ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleOverrideOpen(item)}
                          className="cursor-pointer"
                        >
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          {t("branchOverride")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/menu/categories/${item.id}`)
                          }
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {commonT("viewDetails")}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelected(item);
                            setOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <FaPen className="mr-2" size={12} />
                          {commonT("edit")}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/menu/categories/${item.id}`)
                          }
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {commonT("viewDetails")}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            updateCategoryStatus(
                              {
                                id: item.id,
                                data: {
                                  isActive: !item.isActive,
                                },
                              },
                              {
                                onSuccess: () => {
                                  softRefresh();
                                },
                              },
                            );
                          }}
                          className="cursor-pointer"
                        >
                          {item.isActive ? t("deactivate") : t("activate")}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setDeleteId(item.id)}
                          className="cursor-pointer text-red-500 focus:text-red-500"
                        >
                          <FaTrash className="mr-2" size={12} />
                          {commonT("delete")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
              <div className="mb-3 flex justify-end">
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
              </div>

              <div className="flex gap-4">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/80"}
                  alt={item.name || t("imageAlt")}
                  className="h-20 w-20 rounded-[14px] object-cover"
                  loading="lazy"
                />

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold text-gray-900">
                      {item.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {item.description
                        ? item.description.length > 50
                          ? `${item.description.slice(0, 50)}...`
                          : item.description
                        : commonT("noData")}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-primary">
                    {item.slug || "-"}
                  </span>

                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge tone={(item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive) ? "success" : "neutral"}>
                      {(item.branchOverride?.isAvailable ??
                        item.branchOverrides?.[0]?.isAvailable ??
                        item.isAvailable ??
                        item.isActive)
                        ? commonT("active")
                        : commonT("inactive")}
                    </StatusBadge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                          type="button"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-[180px]">
                        {isBranchAdmin ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleOverrideOpen(item)}
                              className="cursor-pointer"
                            >
                              <SlidersHorizontal className="mr-2 h-4 w-4" />
                              {t("branchOverride")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/menu/categories/${item.id}`)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {commonT("viewDetails")}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(item);
                                setOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <FaPen className="mr-2" size={12} />
                              {commonT("edit")}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/menu/categories/${item.id}`)
                              }
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {commonT("viewDetails")}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                updateCategoryStatus(
                                  {
                                    id: item.id,
                                    data: {
                                      isActive: !item.isActive,
                                    },
                                  },
                                  {
                                    onSuccess: () => {
                                      softRefresh();
                                    },
                                  },
                                );
                              }}
                              className="cursor-pointer"
                            >
                              {item.isActive ? t("deactivate") : t("activate")}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setDeleteId(item.id)}
                              className="cursor-pointer text-red-500 focus:text-red-500"
                            >
                              <FaTrash className="mr-2" size={12} />
                              {commonT("delete")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  onLoadMore={handleLoadMore}
                  isFetching={isFetching && page > 1}
                  hasMore={hasMore}
                  total={pagination.total}
                  shown={allItems.length}
                  label="categories"
                />
              </div>
              <div className="md:hidden">
                <InfiniteScrollFooter
                  loadMoreRef={mobileLoadMoreRef}
                  onLoadMore={handleLoadMore}
                  isFetching={isFetching && page > 1}
                  hasMore={hasMore}
                  total={pagination.total}
                  shown={allItems.length}
                  label="categories"
                />
              </div>
            </>
          ) : null}
        />}
      </div>

      {overrideCategory ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("overrideTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("overrideDescription", {
                  name: overrideCategory?.name || t("thisCategory"),
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
                onClick={() => setOverrideCategory(null)}
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

      <CreateCategoryModalParent
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
