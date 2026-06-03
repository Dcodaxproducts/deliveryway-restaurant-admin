"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useInfiniteModifierCategories } from "@/hooks/useModifierCategories";
import type { ModifierCategory } from "@/types/modifier-categories";
import type { ModifierCategorySummary } from "@/types/modifiers";

type ModifierCategoryInfiniteSelectProps = {
  value?: string;
  onChange: (categoryId: string) => void;
  restaurantId?: string;
  selectedCategory?: ModifierCategorySummary | null;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

const SEARCH_DEBOUNCE_MS = 350;

const mergeUniqueCategories = (
  previous: ModifierCategory[],
  next: ModifierCategory[]
) => {
  const categories = new Map<string, ModifierCategory>();

  [...previous, ...next].forEach((category) => {
    categories.set(category.id, category);
  });

  return Array.from(categories.values());
};

export default function ModifierCategoryInfiniteSelect({
  value,
  onChange,
  restaurantId,
  selectedCategory,
  placeholder = "Select category",
  disabled = false,
  allowClear = false,
}: ModifierCategoryInfiniteSelectProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteModifierCategories({
    restaurantId,
    search: debouncedSearch || undefined,
    limit: 20,
    all: true,
  });

  const categories = useMemo(() => {
    return (data?.pages ?? []).reduce<ModifierCategory[]>(
      (all, page) => mergeUniqueCategories(all, page.data),
      []
    );
  }, [data?.pages]);

  const selected = useMemo(() => {
    const loadedCategory = categories.find((category) => category.id === value);

    if (loadedCategory) return loadedCategory;
    if (!value || !selectedCategory) return undefined;

    return {
      id: selectedCategory.id,
      name: selectedCategory.name,
      slug: selectedCategory.slug ?? "",
    } satisfies ModifierCategory;
  }, [categories, selectedCategory, value]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 40;

    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-[44px] w-full items-center justify-between gap-2 rounded-[14px] border border-gray-200 bg-[#FAFAFA] px-3 text-left text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span
            className={`block truncate ${
              selected ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selected?.name || placeholder}
          </span>
          {selected?.slug ? (
            <span className="block truncate text-[11px] text-gray-400">
              {selected.slug}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {allowClear && value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelect("");
                }
              }}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Clear modifier category"
            >
              <X size={14} />
            </span>
          ) : null}
          <ChevronDown size={16} className="text-gray-400" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full min-w-[280px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="flex h-9 items-center gap-2 rounded-[10px] border border-gray-200 px-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search modifier categories..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div
            role="listbox"
            className="max-h-[280px] overflow-y-auto py-1"
            onScroll={handleScroll}
          >
            {categories.map((category) => (
              <CategoryOption
                key={category.id}
                category={category}
                selected={category.id === value}
                onSelect={() => handleSelect(category.id)}
              />
            ))}

            {isLoading || isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-500">
                <Loader2 size={15} className="animate-spin" />
                Loading categories...
              </div>
            ) : null}

            {!isLoading && categories.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                No modifier categories found
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryOption({
  category,
  selected,
  onSelect,
}: {
  category: ModifierCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
        selected
          ? "bg-primary/10 text-primary"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{category.name}</span>
        {category.slug || category.description ? (
          <span className="block truncate text-[11px] text-gray-400">
            {category.slug || category.description}
          </span>
        ) : null}
      </span>

      {selected ? <Check size={15} className="shrink-0" /> : null}
    </button>
  );
}
