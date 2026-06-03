"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInfiniteCategories } from "@/hooks/useMenuCategories";
import {
  getCategoryInitials,
  mergeUniqueCategoryOptions,
} from "@/lib/category-options";
import type { MenuCategoryOption } from "@/types/categories";

type CategoryInfiniteSelectProps = {
  value?: string;
  onChange: (categoryId: string | undefined) => void;
  restaurantId?: string;
  branchId?: string;
  placeholder?: string;
  disabled?: boolean;
};

const SEARCH_DEBOUNCE_MS = 350;

export default function CategoryInfiniteSelect({
  value,
  onChange,
  restaurantId,
  branchId,
  placeholder = "All categories",
  disabled = false,
}: CategoryInfiniteSelectProps) {
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
  } = useInfiniteCategories({
    search: debouncedSearch || undefined,
    restaurantId: restaurantId || undefined,
    branchId: branchId || undefined,
    limit: 20,
    sortBy: "name",
    sortOrder: "ASC",
  });

  const categories = useMemo(() => {
    return (data?.pages ?? []).reduce<MenuCategoryOption[]>(
      (all, page) => mergeUniqueCategoryOptions(all, page.data),
      []
    );
  }, [data?.pages]);

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id === value);
  }, [categories, value]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 40;

    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const handleSelect = (categoryId: string | undefined) => {
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
        <span className="flex min-w-0 items-center gap-2">
          {selectedCategory ? (
            <CategoryAvatar category={selectedCategory} />
          ) : null}

          <span
            className={`truncate ${
              selectedCategory ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {selectedCategory?.name || (value ? "Selected category" : placeholder)}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                handleSelect(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleSelect(undefined);
                }
              }}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Clear category filter"
            >
              <X size={14} />
            </span>
          ) : null}
          <ChevronDown size={16} className="text-gray-400" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full min-w-[260px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="flex h-9 items-center gap-2 rounded-[10px] border border-gray-200 px-2">
              <Search size={14} className="text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div
            role="listbox"
            className="max-h-[280px] overflow-y-auto py-1"
            onScroll={handleScroll}
          >
            <CategoryOption
              selected={!value}
              label="All categories"
              onSelect={() => handleSelect(undefined)}
            />

            {categories.map((category) => (
              <CategoryOption
                key={category.id}
                selected={category.id === value}
                category={category}
                label={category.name}
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
                No categories found
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type CategoryOptionProps = {
  selected: boolean;
  label: string;
  category?: MenuCategoryOption;
  onSelect: () => void;
};

function CategoryOption({
  selected,
  label,
  category,
  onSelect,
}: CategoryOptionProps) {
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
      <span className="flex min-w-0 items-center gap-2">
        {category ? <CategoryAvatar category={category} /> : null}
        <span className="min-w-0">
          <span className="block truncate font-medium">{label}</span>
          {typeof category?.itemCount === "number" ? (
            <span className="block text-[11px] text-gray-400">
              {category.itemCount} items
            </span>
          ) : null}
        </span>
      </span>

      {selected ? <Check size={15} className="shrink-0" /> : null}
    </button>
  );
}

function CategoryAvatar({ category }: { category: MenuCategoryOption }) {
  return (
    <Avatar className="h-7 w-7 rounded-[8px] border border-gray-100">
      {category.imageUrl ? (
        <AvatarImage
          src={category.imageUrl}
          alt={category.name}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="rounded-[8px] bg-gray-100 text-[10px] font-semibold text-gray-500">
        {getCategoryInitials(category.name)}
      </AvatarFallback>
    </Avatar>
  );
}
