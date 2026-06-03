"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import type { UIEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { formatDealPrice } from "@/components/pages/Menu/deals/utils/admin-deals-formatters";
import { normalizeAdminDealMenuItem } from "@/components/pages/Menu/deals/utils/admin-deals-normalizers";
import { Button } from "@/components/ui/button";
import { getMenuItems } from "@/services/menu/menu.api";
import type { AdminDealMenuItemSummary } from "@/types/admin-deals";
import { useTranslations } from "next-intl";

type AdminDealMenuItemSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
  restaurantId?: string;
  initialItems?: AdminDealMenuItemSummary[];
  error?: string;
};

const MENU_ITEMS_PAGE_SIZE = 10;

const getResponseItems = (response: unknown): AdminDealMenuItemSummary[] => {
  const source = response && typeof response === "object" ? response : {};
  const record = source as Record<string, unknown>;
  const data = record.data;

  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)
      ? ((data as Record<string, unknown>).data as unknown[])
      : [];

  return items
    .map((item) => normalizeAdminDealMenuItem(item))
    .filter((item): item is AdminDealMenuItemSummary => item !== null);
};

const getHasNext = (itemCount: number) => itemCount > 0;

const mergeItems = (
  current: AdminDealMenuItemSummary[],
  next: AdminDealMenuItemSummary[]
) => {
  const itemMap = new Map<string, AdminDealMenuItemSummary>();
  [...current, ...next].forEach((item) => itemMap.set(item.id, item));

  return Array.from(itemMap.values());
};

export default function AdminDealMenuItemSelector({
  value,
  onChange,
  restaurantId,
  initialItems = [],
  error,
}: AdminDealMenuItemSelectorProps) {
  const t = useTranslations("deals.menuItemSelector");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<AdminDealMenuItemSummary[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptions((current) => mergeItems(current, initialItems));
  }, [initialItems]);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      setLoading(true);
      try {
        const response: unknown = await getMenuItems({
          page,
          limit: MENU_ITEMS_PAGE_SIZE,
          search,
          restaurantId,
        });
        const items = getResponseItems(response);

        if (mounted) {
          setOptions((current) => {
            if (page === 1) return mergeItems(initialItems, items);
            return mergeItems(current, items);
          });
          setHasNext(getHasNext(items.length));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(loadItems, page === 1 ? 300 : 0);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [initialItems, page, restaurantId, search]);

  useEffect(() => {
    setPage(1);
  }, [restaurantId]);

  const selectedItems = useMemo(() => {
    return value
      .map((id) => options.find((item) => item.id === id))
      .filter((item): item is AdminDealMenuItemSummary => Boolean(item));
  }, [options, value]);

  const toggleItem = (item: AdminDealMenuItemSummary) => {
    if (value.includes(item.id)) {
      onChange(value.filter((id) => id !== item.id));
      return;
    }

    onChange([...value, item.id]);
  };

  const handleOptionsScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isNearBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 40;

    if (isNearBottom && hasNext && !loading) {
      setPage((currentPage) => currentPage + 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[14px] border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder={t("searchPlaceholder")}
              className="h-[42px] w-full rounded-[12px] border border-gray-200 bg-[#FAFAFA] pl-10 pr-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div
          className="max-h-[360px] overflow-y-auto p-2"
          onScroll={handleOptionsScroll}
        >
          {options.map((item) => {
            const selected = value.includes(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item)}
                className={`mb-2 flex w-full items-center gap-3 rounded-[12px] border p-3 text-left transition ${
                  selected
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-xs font-semibold text-gray-400">
                    {t("imageFallback")}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {item.category?.name || t("noCategory")} •{" "}
                    {formatDealPrice(item.basePrice)}
                  </p>
                </div>

                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-transparent"
                  }`}
                >
                  <Check size={14} />
                </span>
              </button>
            );
          })}

          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : null}

          {!loading && options.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              {t("emptyTitle")}
            </div>
          ) : null}

          {!loading && options.length > 0 ? (
            <div className="border-t border-gray-100 px-2 py-3 text-center text-xs text-gray-400">
              {hasNext
                ? t("loadMoreHint")
                : t("showingCount", { count: options.length.toLocaleString() })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {t("selectedCount", { count: value.length })}
        </span>
        {value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange([])}
            className="h-8 rounded-full px-3 text-xs text-gray-500"
          >
            <X size={13} className="mr-1" />
            {t("clear")}
          </Button>
        ) : null}
      </div>

      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {item.name}
            </span>
          ))}
        </div>
      ) : null}

      <p className={error ? "text-xs text-primary" : "text-xs text-gray-500"}>
        {error || t("help")}
      </p>
    </div>
  );
}
