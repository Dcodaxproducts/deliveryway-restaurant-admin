import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bulkCreateMenuCategories,
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  getMenuCategoryOptions,
  getMenuCategoryById,
  getModifierGroupCategories,
  reorderMenuCategories,
  updateMenuCategory,
  upsertMenuCategoryBranchOverride,
  type MenuCategoryBranchOverridePayload,
} from "@/services/menu/categories/menu-categories.api";
import type { ApiMeta } from "@/lib/response";
import type {
  MenuCategoriesListResponse,
  MenuCategoryListParams,
} from "@/types/categories";
import type {
  BulkMenuCategoriesValues,
  MenuCategoryValues,
  UpdateMenuCategoryValues,
} from "@/validations/categories";

/**
 * ==============================
 * MENU CATEGORIES HOOKS
 * ==============================
 */

export const useCreateMenuCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MenuCategoryValues) => createMenuCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Menu category created successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create menu category"
      );
    },
  });
};

export const useGetMenuCategories = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  parentCategoryId?: string;
  inactive?: boolean;
  includeInactive?: boolean;
  sortOrder?: "ASC" | "DESC";
}) => {
  return useQuery({
    queryKey: [
      "menu-categories",
      params?.page,
      params?.limit,
      params?.search,
      params?.restaurantId,
      params?.branchId,
      params?.parentCategoryId,
      params?.inactive,
      params?.includeInactive,
      params?.sortOrder,
    ],
    queryFn: () => getMenuCategories(params),
  });
};

export const getNextCategoriesPageParam = (
  lastPage: MenuCategoriesListResponse,
  allPages: MenuCategoriesListResponse[]
) => {
  const meta: ApiMeta | null = lastPage.meta;
  const currentPage = Number(meta?.page ?? allPages.length);
  const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);

  if (typeof meta?.hasNext === "boolean") {
    return meta.hasNext ? currentPage + 1 : undefined;
  }

  if (totalPages > 0) {
    return currentPage < totalPages ? currentPage + 1 : undefined;
  }

  return lastPage.data.length > 0 ? allPages.length + 1 : undefined;
};

export const useInfiniteCategories = (params?: MenuCategoryListParams) => {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: [
      "menu-categories",
      "infinite",
      params?.search ?? "",
      params?.restaurantId ?? "",
      params?.branchId ?? "",
      params?.parentCategoryId ?? "",
      params?.inactive,
      params?.includeInactive,
      params?.sortBy ?? "",
      params?.sortOrder ?? "",
      limit,
    ],
    queryFn: ({ pageParam }) =>
      getMenuCategoryOptions({
        ...params,
        page: pageParam,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: getNextCategoriesPageParam,
    enabled: Boolean(params?.restaurantId),
  });
};


export const useUpsertMenuCategoryBranchOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MenuCategoryBranchOverridePayload) =>
      upsertMenuCategoryBranchOverride(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Branch category override saved");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to save branch category override"
      );
    },
  });
};

export const useBulkCreateMenuCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkMenuCategoriesValues) =>
      bulkCreateMenuCategories(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Menu categories created successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to bulk create menu categories"
      );
    },
  });
};

export const useUpdateMenuCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UpdateMenuCategoryValues>;
    }) => updateMenuCategory(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-category", variables.id],
      });
      toast.success("Menu category updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update menu category"
      );
    },
  });
};

export const useDeleteMenuCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMenuCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      toast.success("Menu category deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to delete menu category"
      );
    },
  });
};


export const useGetModifierGroupCategories = (groupId?: string) => {
  return useQuery({
    queryKey: ["modifier-group-categories", groupId],
    queryFn: () => getModifierGroupCategories(groupId as string),
    enabled: !!groupId,
  });
};
export const useGetMenuCategoryById = (id?: string) => {
  return useQuery({
    queryKey: ["menu-category", id],
    queryFn: () => getMenuCategoryById(id as string),
    enabled: !!id,
  });
};


export const useReorderMenuCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderMenuCategories,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Menu categories reordered successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to reorder menu categories"
      );
    },
  });
};
