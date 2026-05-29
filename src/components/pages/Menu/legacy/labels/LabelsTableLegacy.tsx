"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaPen, FaTrash } from "react-icons/fa";
import {
  BadgeCheck,
  Filter,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
  Tag,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import PaginationSection from "@/components/common/pagination";
import DeleteDialog from "@/components/common/dialogs/delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import {
  useCreateMenuItemLabel,
  useDeleteMenuItemLabel,
  useGetMenuItemLabels,
  useUpdateMenuItemLabel,
} from "@/hooks/useProductLabel";

const PAGE_LIMIT = 10;

type SortOrder = "ASC" | "DESC";
type SortBy = "value" | "label";

type LabelItem = {
  value: string;
  label: string;
};

const SORT_OPTIONS: Array<{
  label: string;
  value: SortBy;
}> = [
  {
    label: "Value",
    value: "value",
  },
  {
    label: "Label",
    value: "label",
  },
];

const extractLabels = (response: any): LabelItem[] => {
  if (!response) return [];

  const candidates = [
    response?.data?.labels,
    response?.data?.items,
    response?.data?.data?.labels,
    response?.data?.data?.items,
    response?.data?.data,
    response?.labels,
    response?.items,
    response?.data,
    response,
  ];

  const raw = candidates.find((candidate) => Array.isArray(candidate));

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      value: String(item?.value || "").trim(),
      label: String(item?.label || "").trim(),
    }))
    .filter((item) => item.value || item.label);
};

const normalizeText = (value: string) => {
  return value.trim().toLowerCase();
};

const sortLabels = (
  items: LabelItem[],
  sortBy: SortBy,
  sortOrder: SortOrder
) => {
  return [...items].sort((a, b) => {
    const aValue = normalizeText(a?.[sortBy] || "");
    const bValue = normalizeText(b?.[sortBy] || "");

    const result = aValue.localeCompare(bValue);

    return sortOrder === "ASC" ? result : -result;
  });
};

const createValueFromLabel = (label: string) => {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function LabelsTable() {
  const { user, restaurantId: authRestaurantId } = useAuth();

  const restaurantId =
    authRestaurantId ?? user?.restaurantId ?? user?.tenantId ?? "";

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortBy, setSortBy] = useState<SortBy>("label");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<LabelItem | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<LabelItem | null>(null);

  const canMutateLabels = Boolean(restaurantId);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetMenuItemLabels(
    restaurantId
      ? {
          restaurantId,
        }
      : undefined
  );

  const { mutate: createLabel, isPending: isCreating } =
    useCreateMenuItemLabel();

  const { mutate: updateLabel, isPending: isUpdating } =
    useUpdateMenuItemLabel();

  const { mutate: deleteLabel, isPending: isDeleting } =
    useDeleteMenuItemLabel();

  const allItems = useMemo(() => {
    return extractLabels(response);
  }, [response]);

  const filteredItems = useMemo(() => {
    const keyword = normalizeText(debouncedSearch);

    const searchedItems = keyword
      ? allItems.filter((item) => {
          const searchableText = `${item.value} ${item.label}`.toLowerCase();
          return searchableText.includes(keyword);
        })
      : allItems;

    return sortLabels(searchedItems, sortBy, sortOrder);
  }, [allItems, debouncedSearch, sortBy, sortOrder]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * PAGE_LIMIT;
    return filteredItems.slice(startIndex, startIndex + PAGE_LIMIT);
  }, [filteredItems, page]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_LIMIT));

  const pagination = {
    page,
    totalPages,
    total: filteredItems.length,
    limit: PAGE_LIMIT,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };

  const hasActiveFilters = Boolean(
    search.trim() || debouncedSearch || sortBy !== "label" || sortOrder !== "ASC"
  );

  const shouldShowInitialLoader = isLoading && allItems.length === 0;
  const shouldShowRefreshing = isFetching && !shouldShowInitialLoader;
  const shouldShowEmpty =
    !isLoading && !isFetching && paginatedItems.length === 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openCreateModal = () => {
    setSelected(null);
    setOpen(true);
  };

  const openEditModal = (item: LabelItem) => {
    setSelected(item);
    setOpen(true);
  };

  const handleManualSearch = () => {
    const nextSearch = search.trim();

    setDebouncedSearch(nextSearch);
    setPage(1);

    if (debouncedSearch === nextSearch) {
      refetch();
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSortBy("label");
    setSortOrder("ASC");
    setPage(1);

    if (!hasActiveFilters) {
      refetch();
    }
  };

  const handleDelete = () => {
    if (!deleteTarget || !restaurantId) return;

    deleteLabel(
      {
        restaurantId,
        value: deleteTarget.value,
      },
      {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
        },
      }
    );
  };

  const handleSubmitLabel = (values: LabelItem) => {
    if (!restaurantId) return;

    const payload = {
      value: values.value.trim(),
      label: values.label.trim(),
    };

    if (!payload.value || !payload.label) return;

    if (selected) {
      updateLabel(
        {
          restaurantId,
          value: selected.value,
          payload,
        },
        {
          onSuccess: () => {
            setOpen(false);
            setSelected(null);
            refetch();
          },
        }
      );

      return;
    }

    createLabel(
      {
        restaurantId,
        payload,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelected(null);
          setPage(1);
          refetch();
        },
      }
    );
  };

  const SkeletonRow = () => (
    <tr>
      <td colSpan={5} className="px-4 py-5">
        <div className="grid animate-pulse grid-cols-[1fr_2fr_1fr_0.8fr_0.5fr] gap-4">
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
          <div className="h-4 rounded bg-gray-200" />
        </div>
      </td>
    </tr>
  );

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        <div className="h-4 w-[140px] max-w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-[160px] max-w-full rounded bg-gray-200" />
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="mx-auto max-w-[420px] px-4 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BadgeCheck size={22} />
      </div>

      <p className="text-base font-semibold text-gray-900">
        No labels found
      </p>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        {hasActiveFilters
          ? "No labels match your current search or sorting options."
          : "Add menu labels like Vegan, Spicy, Popular, New, Recommended, or Gluten Free."}
      </p>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleResetFilters}
          className="mt-4 rounded-[12px]"
        >
          <RefreshCcw size={16} className="mr-2" />
          Reset Filters
        </Button>
      ) : (
        <Button
          type="button"
          onClick={openCreateModal}
          disabled={!canMutateLabels}
          className="mt-4 rounded-[12px] bg-primary text-white hover:bg-primary/90"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Label
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-5 flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-[20px] font-semibold text-gray-900">
            Menu Item Labels
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Maintain reusable labels shown on menu items.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateModal}
          disabled={!canMutateLabels}
          className="h-[42px] shrink-0 rounded-[12px] bg-primary px-4 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Label
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total Labels"
          value={allItems.length}
          icon={<BadgeCheck size={18} />}
        />

        <SummaryCard
          label="Visible Templates"
          value={filteredItems.length}
          icon={<Tag size={18} />}
        />

        <SummaryCard
          label="Current Page"
          value={paginatedItems.length}
          icon={<Filter size={18} />}
        />
      </div>

      <div className="mb-6 w-full max-w-full overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
              <Filter size={18} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Label Filters
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Search by value or label. Sorting is handled locally for quick
                label management.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
              Showing {paginatedItems.length}
              {filteredItems.length > 0 ? ` of ${filteredItems.length}` : ""}
            </span>

            {shouldShowRefreshing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                <Loader2 size={12} className="animate-spin" />
                Refreshing
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:items-end">
          <div className="min-w-0 xl:col-span-5">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Search
            </label>

            <div className="relative min-w-0">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                placeholder="Search by value or label..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleManualSearch();
                  }
                }}
                className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="min-w-0 xl:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Sort By
            </label>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as SortBy);
                setPage(1);
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 xl:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Order
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as SortOrder);
                setPage(1);
              }}
              className="h-[44px] w-full min-w-0 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            >
              <option value="ASC">ASC</option>
              <option value="DESC">DESC</option>
            </select>
          </div>

          <Button
            onClick={handleManualSearch}
            className="h-[44px] rounded-[14px] bg-primary px-5 text-white shadow-sm hover:bg-primary/90 md:w-full xl:col-span-1"
          >
            Search
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!hasActiveFilters && !isFetching}
            onClick={handleResetFilters}
            className="h-[44px] rounded-[14px] border-gray-200 px-4 text-gray-700 md:w-full xl:col-span-1"
          >
            <RefreshCcw size={15} className="mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {!canMutateLabels ? (
        <div className="mb-6 rounded-[18px] border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
          Restaurant context is missing. Creating, updating, or deleting labels
          requires a restaurant ID.
        </div>
      ) : null}

      <div className="hidden w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-[#FAFAFA] text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[28%] px-4 py-4">Value</th>
              <th className="w-[42%] px-4 py-4">Label</th>
              <th className="w-[20%] px-4 py-4 text-center">Usage</th>
              <th className="w-[10%] px-4 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {shouldShowInitialLoader ? (
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : shouldShowEmpty ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.value}
                  className="border-b border-gray-100 transition hover:bg-[#FAFAFA]"
                >
                  <td className="px-4 py-4">
                    <div className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <span className="truncate">{item.value || "-"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="truncate font-semibold text-gray-900">
                      {item.label || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      Menu Label
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Edit"
                        disabled={!canMutateLabels}
                        onClick={() => openEditModal(item)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Edit label"
                      >
                        <FaPen size={13} />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        disabled={!canMutateLabels}
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete label"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="border-t border-gray-100 px-4 py-4">
          <PaginationSection {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <div className="w-full max-w-full space-y-4 md:hidden">
        {shouldShowInitialLoader ? (
          Array.from({ length: 5 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : shouldShowEmpty ? (
          <div className="rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
            <EmptyState />
          </div>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.value}
              className="w-full max-w-full overflow-hidden rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <span className="truncate">{item.value || "-"}</span>
                  </div>

                  <h3 className="mt-3 truncate text-[16px] font-semibold text-gray-900">
                    {item.label || "-"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Menu item display label
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  Label
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={!canMutateLabels}
                  onClick={() => openEditModal(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPen size={13} />
                  Edit
                </button>

                <button
                  type="button"
                  disabled={!canMutateLabels}
                  onClick={() => setDeleteTarget(item)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaTrash size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <div className="w-full max-w-full overflow-hidden">
          <PaginationSection {...pagination} onPageChange={setPage} />
        </div>
      </div>

      <LabelModal
        open={open}
        initialData={selected}
        loading={isCreating || isUpdating}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setSelected(null);
          }
        }}
        onSubmit={handleSubmitLabel}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(value) => {
          if (!value) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Label"
        description="Are you sure you want to delete this label? This action cannot be undone."
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
        {icon}
      </div>

      <div>
        <p className="text-2xl font-semibold leading-none text-gray-950">
          {value}
        </p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function LabelModal({
  open,
  initialData,
  loading,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initialData: LabelItem | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LabelItem) => void;
}) {
  const [form, setForm] = useState<LabelItem>({
    value: "",
    label: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      value: initialData?.value || "",
      label: initialData?.label || "",
    });
  }, [open, initialData]);

  const canSubmit = Boolean(form.value.trim() && form.label.trim());

  const handleLabelChange = (label: string) => {
    setForm((prev) => ({
      ...prev,
      label,
      value: prev.value || createValueFromLabel(label),
    }));
  };

  const handleSubmit = () => {
    if (!canSubmit || loading) return;

    onSubmit({
      value: form.value.trim(),
      label: form.label.trim(),
    });
  };

  const isEditMode = Boolean(initialData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className="max-w-[540px] rounded-[22px] border-0 bg-white p-0 shadow-xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b border-gray-100 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-950">
                {isEditMode ? "Edit Label" : "Add Label"}
              </DialogTitle>

              <p className="mt-1 text-sm text-gray-500">
                Define label value and display label for menu items.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Label
            </label>

            <input
              value={form.label}
              onChange={(event) => handleLabelChange(event.target.value)}
              placeholder="Example: Vegan"
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Value
            </label>

            <input
              value={form.value}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  value: event.target.value,
                }))
              }
              placeholder="Example: vegan"
              className="h-[44px] w-full rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"
            />

            <p className="mt-1.5 text-xs text-gray-400">
              Use a stable lowercase value because menu items reference labels
              by this value.
            </p>
          </div>

          <div className="rounded-[14px] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <BadgeCheck
                size={18}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <p className="text-sm leading-6 text-blue-800">
                Labels help customers quickly identify menu properties like
                Vegan, Spicy, Popular, Recommended, New, or Gluten Free.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-[12px]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className="rounded-[12px] bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditMode ? (
              "Update Label"
            ) : (
              "Create Label"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}