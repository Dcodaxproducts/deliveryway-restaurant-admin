"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { deleteMenuCategory, getMenuCategories } from "@/services/menu/categories/menu-categories.api";
import type { MenuCategoryListParams } from "@/types/categories";

export interface Category {
  id: string
  name: string
  slug?: string
}

export default function useCategories(params?: Pick<MenuCategoryListParams, "page" | "limit">) {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["menu-categories", restaurantId, params?.page, params?.limit],
    queryFn: () => getMenuCategories({
      restaurantId: restaurantId || undefined,
      page: params?.page,
      limit: params?.limit,
    }),
    enabled: Boolean(restaurantId),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteMenuCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
    },
  });

  return {
    categories: (categoriesQuery.data?.data || []) as Category[],
    meta: categoriesQuery.data?.meta,
    loading: categoriesQuery.isLoading || deleteCategoryMutation.isPending,
    fetching: categoriesQuery.isFetching,
    refetch: categoriesQuery.refetch,
    deleteCategory: (id: string) => deleteCategoryMutation.mutateAsync(id),
  }
}
