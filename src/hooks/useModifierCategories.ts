import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import {
  createModifierCategory,
  deleteModifierCategory,
  getModifierCategories,
  updateModifierCategory,
} from "@/services/modifier-categories";
import type {
  ModifierCategoriesListResponse,
  ModifierCategoryListParams,
  ModifierCategoryCreatePayload,
  ModifierCategoryUpdatePayload,
} from "@/types/modifier-categories";

export const modifierCategoryKeys = {
  all: ["modifier-categories"] as const,
  list: (params?: ModifierCategoryListParams) =>
    [
      "modifier-categories",
      params?.restaurantId ?? "",
      params?.search ?? "",
      params?.page ?? "",
      params?.limit ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
  infinite: (params?: ModifierCategoryListParams) =>
    [
      "modifier-categories",
      "infinite",
      params?.restaurantId ?? "",
      params?.search ?? "",
      params?.limit ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
};

export const getNextModifierCategoriesPageParam = (
  lastPage: ModifierCategoriesListResponse,
  allPages: ModifierCategoriesListResponse[]
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

export const useModifierCategories = (params?: ModifierCategoryListParams) =>
  useQuery({
    queryKey: modifierCategoryKeys.list(params),
    queryFn: () => getModifierCategories(params),
    enabled: Boolean(params?.restaurantId),
  });

export const useInfiniteModifierCategories = (
  params?: ModifierCategoryListParams
) => {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: modifierCategoryKeys.infinite({ ...params, limit }),
    queryFn: ({ pageParam }) =>
      getModifierCategories({
        ...params,
        page: pageParam,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextModifierCategoriesPageParam,
    enabled: Boolean(params?.restaurantId),
  });
};

export const useCreateModifierCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModifierCategoryCreatePayload) =>
      createModifierCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      toast.success("Modifier category created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to create modifier category")
      );
    },
  });
};

export const useUpdateModifierCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ModifierCategoryUpdatePayload;
    }) => updateModifierCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      toast.success("Modifier category updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to update modifier category")
      );
    },
  });
};

export const useDeleteModifierCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteModifierCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierCategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      toast.success("Modifier category deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to delete modifier category")
      );
    },
  });
};
