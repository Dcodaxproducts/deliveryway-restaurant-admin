import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCuisines } from "@/services/cuisines";
import type { CuisineListParams, CuisinesListResponse } from "@/types/cuisines";

export const cuisineKeys = {
  all: ["cuisines"] as const,
  list: (params?: CuisineListParams) =>
    [
      "cuisines",
      params?.restaurantId ?? "",
      params?.search ?? "",
      params?.page ?? "",
      params?.limit ?? "",
      params?.sortBy ?? "",
      params?.sortOrder ?? "",
      params?.includeInactive ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
  infinite: (params?: CuisineListParams) =>
    [
      "cuisines",
      "infinite",
      params?.restaurantId ?? "",
      params?.search ?? "",
      params?.limit ?? "",
      params?.sortBy ?? "",
      params?.sortOrder ?? "",
      params?.includeInactive ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
};

export const getNextCuisinesPageParam = (
  lastPage: CuisinesListResponse,
  allPages: CuisinesListResponse[]
) => {
  const currentPage = Number(lastPage.meta.page || allPages.length);
  const totalPages = Number(lastPage.meta.totalPages || 0);

  if (typeof lastPage.meta.hasNext === "boolean") {
    return lastPage.meta.hasNext ? currentPage + 1 : undefined;
  }

  if (totalPages > 0) {
    return currentPage < totalPages ? currentPage + 1 : undefined;
  }

  return lastPage.data.length > 0 ? allPages.length + 1 : undefined;
};

export const useCuisines = (params?: CuisineListParams) =>
  useQuery({
    queryKey: cuisineKeys.list(params),
    queryFn: () => getCuisines(params),
    enabled: !params?.restaurantId || Boolean(params.restaurantId),
  });

export const useInfiniteCuisines = (params?: CuisineListParams) => {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: cuisineKeys.infinite({ ...params, limit }),
    queryFn: ({ pageParam }) =>
      getCuisines({
        ...params,
        page: pageParam,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextCuisinesPageParam,
    enabled: !params?.restaurantId || Boolean(params.restaurantId),
  });
};
