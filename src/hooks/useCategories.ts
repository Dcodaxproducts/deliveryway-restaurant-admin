"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { deleteMenuCategory, getMenuCategories } from "@/services/menu/categories/menu-categories.api";

export interface Category {
  id: string
  name: string
  slug?: string
}

export default function useCategories() {
  const { restaurantId } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["menu-categories", restaurantId],
    queryFn: () => getMenuCategories({ restaurantId: restaurantId || undefined }),
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
    loading: categoriesQuery.isLoading || deleteCategoryMutation.isPending,
    refetch: categoriesQuery.refetch,
    deleteCategory: (id: string) => deleteCategoryMutation.mutateAsync(id),
  }
}
