"use client";

import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "@/services/global-search";

export type UseGlobalSearchParams = {
  query: string;
  restaurantId?: string;
  branchId?: string;
  enabled?: boolean;
  limit?: number;
};

export const useGlobalSearch = ({
  query,
  restaurantId,
  branchId,
  enabled = true,
  limit,
}: UseGlobalSearchParams) => {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: ["global-search", trimmedQuery, restaurantId, branchId, limit],
    queryFn: () =>
      globalSearch({
        query: trimmedQuery,
        restaurantId,
        branchId,
        limit,
      }),
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
};
