"use client";

import { useEffect, useState } from "react";

import { normalizeAdminDealMenuItem } from "@/components/pages/Menu/deals/utils/admin-deals-normalizers";
import { getMenuItems } from "@/services/menu/menu.api";
import type { AdminDealMenuItemSummary } from "@/types/admin-deals";

const EMPTY_INITIAL_ITEMS: AdminDealMenuItemSummary[] = [];

export const resolveAdminDealInitialItems = (
  initialItems?: AdminDealMenuItemSummary[],
) => initialItems ?? EMPTY_INITIAL_ITEMS;

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

const mergeItems = (
  current: AdminDealMenuItemSummary[],
  next: AdminDealMenuItemSummary[]
) => {
  const itemMap = new Map<string, AdminDealMenuItemSummary>();
  [...current, ...next].forEach((item) => itemMap.set(item.id, item));

  return Array.from(itemMap.values());
};

type UseAdminDealMenuItemsParams = {
  page: number;
  limit: number;
  search: string;
  restaurantId?: string;
  categoryId?: string;
  initialItems?: AdminDealMenuItemSummary[];
};

export const useAdminDealMenuItems = ({
  page,
  limit,
  search,
  restaurantId,
  categoryId,
  initialItems,
}: UseAdminDealMenuItemsParams) => {
  const resolvedInitialItems = resolveAdminDealInitialItems(initialItems);
  const [options, setOptions] =
    useState<AdminDealMenuItemSummary[]>(resolvedInitialItems);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptions((current) => mergeItems(current, resolvedInitialItems));
  }, [resolvedInitialItems]);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      setLoading(true);
      try {
        const response = await getMenuItems({
          page,
          limit,
          search,
          restaurantId,
          categoryId,
        });
        const items = getResponseItems(response);

        if (mounted) {
          setOptions((current) => {
            if (page === 1) return mergeItems(resolvedInitialItems, items);
            return mergeItems(current, items);
          });
          setHasNext(items.length > 0);
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
  }, [
    categoryId,
    limit,
    page,
    resolvedInitialItems,
    restaurantId,
    search,
  ]);

  return {
    options,
    hasNext,
    loading,
  };
};
