import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import {
  bulkCreateCuisines,
  createCuisine,
  deleteCuisine,
  getCuisine,
  getCuisines,
  reorderCuisines,
  updateCuisine,
} from "@/services/cuisines";
import type {
  CuisineBulkCreatePayload,
  CuisineCreatePayload,
  CuisineListParams,
  CuisineReorderPayload,
  CuisineUpdatePayload,
  CuisinesListResponse,
} from "@/types/cuisines";

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
  detail: (id?: string) => ["cuisine", id ?? ""] as const,
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
    enabled: Boolean(params?.restaurantId),
  });

export const useCuisine = (id?: string) =>
  useQuery({
    queryKey: cuisineKeys.detail(id),
    queryFn: () => getCuisine(id as string),
    enabled: Boolean(id),
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
    enabled: Boolean(params?.restaurantId),
  });
};

export const useCreateCuisine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CuisineCreatePayload) => createCuisine(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Cuisine created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create cuisine"));
    },
  });
};

export const useBulkCreateCuisines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CuisineBulkCreatePayload) => bulkCreateCuisines(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      toast.success("Cuisines created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create cuisines"));
    },
  });
};

export const useUpdateCuisine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CuisineUpdatePayload }) =>
      updateCuisine(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      queryClient.invalidateQueries({ queryKey: cuisineKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Cuisine updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update cuisine"));
    },
  });
};

export const useReorderCuisines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CuisineReorderPayload) => reorderCuisines(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      toast.success("Cuisines reordered successfully");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to reorder cuisines"));
    },
  });
};

export const useDeleteCuisine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCuisine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuisineKeys.all });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Cuisine deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete cuisine"));
    },
  });
};
