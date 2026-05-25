"use client";

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
import DeleteDialog from "@/components/dialogs/delete-dialog";
import { Eye, GripVertical, Loader2, MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import CreateCategoryModalParent from "@/components/menu/listing/CreateCategoryModalParent";
import { useRouter } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import InfiniteScrollFooter from "@/components/common/infinite-scroll-footer";
import { extractResponseItems, extractResponseMeta } from "@/lib/response";

const PAGE_LIMIT = 10;


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
  const { user, restaurantId: authRestaurantId, branchId, isBranchAdmin } = useAuth();
const [statusFilter, setStatusFilter] = useState("all");
const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? user?.tenantId ?? "";

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
  refetch,
} = useGetMenuCategories({
  page,
  limit,
  search: debouncedSearch || undefined,
  restaurantId: restaurantId || undefined,
  sortOrder,

  // only include inactive when "all" selected
  includeInactive: statusFilter === "all",

  inactive:
    statusFilter === "all"
      ? undefined
      : statusFilter === "inactive",
});


  const { mutate: deleteMenuCategory, isPending: isDeleting } =
    useDeleteMenuCategory();

  const { mutate: reorderCategories, isPending: isReordering } =
    useReorderMenuCategories();
const { mutate: updateCategoryStatus } = useUpdateMenuCategory();
const { mutate: saveCategoryOverride, isPending: isSavingOverride } = useUpsertMenuCategoryBranchOverride();
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
    if (!canFetchCategories || !hasLoadedOnce) return false;

    if (pagination.total > 0) {
      return allItems.length < pagination.total;
    }

    return Boolean(pagination.hasNext);
  }, [
    canFetchCategories,
    hasLoadedOnce,
    pagination.total,
    pagination.hasNext,
    allItems.length,
  ]);

  const shouldShowInitialLoader =
    !canFetchCategories ||
    (!hasLoadedOnce && allItems.length === 0) ||
    ((isLoading || isFetching) && page === 1 && allItems.length === 0);

  const shouldShowEmpty =
    canFetchCategories &&
    hasLoadedOnce &&
    !isLoading &&
    !isFetching &&
    allItems.length === 0;

  useEffect(() => {
    if (!canFetchCategories || fetchedItems === null) return;

    setHasLoadedOnce(true);

    setAllItems((prev) => {
      if (page === 1) {
        return fetchedItems;
      }

      return mergeUniqueById(prev, fetchedItems);
    });
  }, [fetchedItems, page, canFetchCategories]);

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
          prev.filter((item) => String(item.id) !== String(deleteId))
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


  const getBranchCategoryOverride = (item: any) =>
    item?.branchOverride || item?.branchOverrides?.[0] || item?.overrides?.[0] || null;

  const handleOverrideOpen = (item: any) => {
    const override = getBranchCategoryOverride(item);

    setOverrideCategory(item);
    setOverrideForm({
      isAvailable: Boolean(override?.isAvailable ?? item?.isAvailable ?? item?.isActive ?? true),
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
      }
    );
  };

  const softRefresh = () => {
    resetAndFetchFirstPage();
  };

  const handleManualSearch = () => {
    if (!canFetchCategories) return;

    const nextSearch = search.trim();

    setPage(1);
    setDebouncedSearch(nextSearch);

    if (page === 1 && debouncedSearch === nextSearch) {
      refetch();
    }
  };

  const SkeletonRow = () => (
    <tr>
      <td colSpan={6} className="py-6">
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

  const EmptyState = () => (
    <div className="py-10 text-center text-gray-400">No categories found</div>
  );

  return (
    <div className="w-full">
    <div className="mb-6 rounded-[18px] border bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <div className="relative flex-1">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />

      <input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <select
      value={statusFilter}
      onChange={(e) => {
        setStatusFilter(e.target.value);
        setPage(1);
      }}
      className="h-[44px] rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm focus:outline-none"
    >
      <option value="all">Active</option>
      <option value="active">Inactive</option>
    </select>

    {/* <select
      value={sortOrder}
      onChange={(e) => {
        setSortOrder(e.target.value as "ASC" | "DESC");
        setPage(1);
      }}
      className="h-[44px] rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm focus:outline-none"
    >
      <option value="DESC">Newest First</option>
      <option value="ASC">Oldest First</option>
    </select> */}

    

    <Button
      disabled={!canFetchCategories}
      onClick={handleManualSearch}
      className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm"
    >
      Search
    </Button>
  </div>
</div>

      {isReordering && !isBranchAdmin ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Saving category order...
        </div>
      ) : null}

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="w-[48px] px-2 py-3"></th>
              <th className="px-2 py-3">Category</th>
              <th className="px-2">Description</th>
              <th className="px-2 text-center">Slug</th>
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
                <td colSpan={6}>
                  <EmptyState />
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
                  className={`border-b transition hover:bg-gray-50 ${
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
                        alt={item.name || "Category"}
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
                  </td>

                  <td className="max-w-[220px] px-2">
                    {item.description ? (
                      <span className="block truncate text-sm text-gray-600">
                        {item.description.length > 40
                          ? `${item.description.slice(0, 40)}...`
                          : item.description}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-2 text-center text-sm text-gray-500">
                    {item.slug || "-"}
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
          <DropdownMenuItem onClick={() => handleOverrideOpen(item)} className="cursor-pointer">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Branch Override
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/menu/categories/${item.id}`)} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View Details
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
        Edit
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() =>
          router.push(`/menu/categories/${item.id}`)
        }
        className="cursor-pointer"
      >
        <Eye className="mr-2 h-4 w-4" />
        View Details
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
            }
          );
        }}
        className="cursor-pointer"
      >
        {item.isActive ? "Deactivate" : "Activate"}
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => setDeleteId(item.id)}
        className="cursor-pointer text-red-500 focus:text-red-500"
      >
        <FaTrash className="mr-2" size={12} />
        Delete
      </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
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
            label="categories"
          />
        ) : null}
      </div>

      <div className="space-y-4 md:hidden">
        {shouldShowInitialLoader ? (
          Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : shouldShowEmpty ? (
          <EmptyState />
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
              <div className="mb-3 flex justify-end">
                {isBranchAdmin ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Scoped branch</span>
                ) : (
                  <div className="flex cursor-grab items-center gap-1 text-xs text-gray-400 active:cursor-grabbing">
                    <GripVertical size={16} />
                    Drag
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/80"}
                  alt={item.name || "Category"}
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
                        : "No description"}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-primary">
                    {item.slug || "-"}
                  </span>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        (item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {(item.branchOverride?.isAvailable ?? item.branchOverrides?.[0]?.isAvailable ?? item.isAvailable ?? item.isActive) ? "Active" : "Inactive"}
                    </span>

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
        <DropdownMenuItem onClick={() => handleOverrideOpen(item)} className="cursor-pointer">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Branch Override
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/menu/categories/${item.id}`)} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
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
      Edit
    </DropdownMenuItem>

    <DropdownMenuItem
      onClick={() =>
        router.push(`/menu/categories/${item.id}`)
      }
      className="cursor-pointer"
    >
      <Eye className="mr-2 h-4 w-4" />
      View Details
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
          }
        );
      }}
      className="cursor-pointer"
    >
      {item.isActive ? "Deactivate" : "Activate"}
    </DropdownMenuItem>

    <DropdownMenuItem
      onClick={() => setDeleteId(item.id)}
      className="cursor-pointer text-red-500 focus:text-red-500"
    >
      <FaTrash className="mr-2" size={12} />
      Delete
    </DropdownMenuItem>
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>
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
            label="categories"
          />
        ) : null}
      </div>

      {overrideCategory ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Branch category override</h3>
              <p className="mt-1 text-sm text-gray-500">
                Override availability for {overrideCategory?.name || "this category"} in your assigned branch.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-[14px] border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                Available in branch
                <input
                  type="checkbox"
                  checked={overrideForm.isAvailable}
                  onChange={(event) =>
                    setOverrideForm((prev) => ({ ...prev, isAvailable: event.target.checked }))
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>

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
              <Button type="button" variant="outline" onClick={() => setOverrideCategory(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveOverride} disabled={isSavingOverride || !branchId}>
                {isSavingOverride ? "Saving..." : "Save override"}
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
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
}