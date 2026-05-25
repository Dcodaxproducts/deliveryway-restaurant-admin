"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaPen, FaTrash } from "react-icons/fa";
import ModifierModal from "@/components/pages/Menu/legacy/ModifierModal";
import PaginationSection from "@/components/common/pagination";
import { Copy, MoreVertical, Search } from "lucide-react";
import {
  useGetModifiers,
  useDeleteModifier,
  useDuplicateModifier,
} from "@/hooks/useMenus";
import DeleteDialog from "@/components/dialogs/delete-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function ModifiersTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { restaurantId: authRestaurantId } = useAuth();
  const restaurantId = authRestaurantId ?? undefined;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    refetch,
  } = useGetModifiers({
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

  const { mutate: deleteModifier, isPending: isDeleting } = useDeleteModifier();

  const { mutate: duplicateModifier, isPending: isDuplicating } =
    useDuplicateModifier();

  const items = useMemo(() => {
    if (!response) return [];

    const raw =
      response?.data?.items ||
      response?.data?.modifiers ||
      response?.data?.data ||
      response?.items ||
      response?.modifiers ||
      response?.data ||
      [];

    return Array.isArray(raw) ? raw : [];
  }, [response]);

  const pagination = useMemo(() => {
    const source =
      response?.data?.pagination ||
      response?.data?.meta ||
      response?.pagination ||
      response?.meta ||
      {};

    const total = Number(source?.total ?? items.length ?? 0);
    const currentPage = Number(source?.page ?? page);
    const pageSize = Number(source?.limit ?? limit);

    const totalPages = Number(
      source?.totalPages ??
        source?.pages ??
        (pageSize > 0 ? Math.ceil(total / pageSize) : 1)
    );

    return {
      page: currentPage,
      totalPages: totalPages || 1,
      total,
      limit: pageSize || limit,
      hasNext: source?.hasNext ?? currentPage < (totalPages || 1),
      hasPrevious:
        source?.hasPrevious ?? source?.hasPrev ?? currentPage > 1,
    };
  }, [response, items.length, page, limit]);

  const formatPrice = (value: any) => {
    const numeric = Number(value ?? 0);

    if (Number.isNaN(numeric)) return "0.00";

    return numeric.toFixed(2);
  };

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

  const SkeletonRow = () => (
    <tr>
      <td colSpan={4} className="py-6">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-4 w-[160px] rounded bg-gray-200" />
          <div className="h-4 w-[90px] rounded bg-gray-200" />
          <div className="h-4 w-[70px] rounded bg-gray-200" />
          <div className="h-4 w-[50px] rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-[18px] border bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div className="h-4 w-[150px] rounded bg-gray-200" />
        <div className="h-3 w-[90px] rounded bg-gray-200" />
        <div className="h-3 w-[70px] rounded bg-gray-200" />
      </div>
    </div>
  );

  const isTableLoading = isLoading || isFetching;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">
            Modifiers
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage reusable item add-ons and base prices.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="h-[40px] rounded-[12px] bg-primary px-4 text-white"
        >
          + Add Modifier
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative w-full max-w-[420px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            placeholder="Search modifiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button
          onClick={() => refetch()}
          disabled={!restaurantId}
          className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm disabled:opacity-60"
        >
          Search
        </Button>
      </div>

      <div className="hidden overflow-x-auto rounded-[16px] bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-2 py-3">Name</th>
              <th className="px-2 text-center">Base Price</th>
              <th className="px-2 text-center">Status</th>
              <th className="px-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-400">
                  No modifiers found
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <div className="flex flex-col">
                      <span className="block font-medium text-gray-900">
                        {item.name || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 text-center font-medium text-gray-900">
                    ${formatPrice(item.priceDelta)}
                  </td>

                  <td className="px-2 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setOpen(true);
                        }}
                        className="text-gray-500 hover:text-primary"
                        aria-label="Edit modifier"
                      >
                        <FaPen size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        className="text-gray-500 hover:text-red-500"
                        aria-label="Delete modifier"
                      >
                        <FaTrash size={14} />
                      </button>

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
                      />
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
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            No modifiers found
          </div>
        ) : (
          items.map((item: any) => (
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
                  <span className="text-sm font-semibold text-primary">
                    ${formatPrice(item.priceDelta)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      item.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        setOpen(true);
                      }}
                      className="text-gray-500 hover:text-primary"
                      aria-label="Edit modifier"
                    >
                      <FaPen size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="text-gray-500 hover:text-red-500"
                      aria-label="Delete modifier"
                    >
                      <FaTrash size={14} />
                    </button>

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
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <PaginationSection {...pagination} onPageChange={setPage} />
      </div>

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
        title="Delete Modifier"
        description="Are you sure you want to delete this modifier? This action cannot be undone."
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
  item: any;
  isOpen: boolean;
  isDuplicating: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDuplicate: (modifierId: string) => void;
}) {
  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) {
      onClose();
    }
  });

  return (
    <div ref={dropdownRef} className="relative flex justify-center">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        aria-label="Modifier actions"
      >
        <MoreVertical size={17} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-9 z-30 w-[160px] overflow-hidden rounded-[12px] border border-gray-100 bg-white py-1 text-left shadow-lg">
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
        </div>
      ) : null}
    </div>
  );
}