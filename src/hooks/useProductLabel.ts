import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  CreateMenuItemLabelParams,
  DeleteMenuItemLabelParams,
  GetMenuItemLabelsParams,
  UpdateMenuItemLabelParams,
  createMenuItemLabel,
  deleteMenuItemLabel,
  getMenuItemLabels,
  updateMenuItemLabel,
} from "@/services/menu/labels/labels.api";

/**
 * ==============================
 * QUERY KEYS
 * ==============================
 */

export const menuItemLabelKeys = {
  all: ["menu-item-labels"] as const,

  list: (restaurantId?: string) =>
    ["menu-item-labels", restaurantId || ""] as const,
};

/**
 * ==============================
 * QUERY HOOKS
 * ==============================
 */

export const useGetMenuItemLabels = (params?: GetMenuItemLabelsParams) => {
  return useQuery({
    queryKey: menuItemLabelKeys.list(params?.restaurantId),
    queryFn: () => getMenuItemLabels(params as GetMenuItemLabelsParams),
    enabled: Boolean(params?.restaurantId),
  });
};

/**
 * ==============================
 * MUTATION HOOKS
 * ==============================
 */

export const useCreateMenuItemLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateMenuItemLabelParams) =>
      createMenuItemLabel(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.list(variables.restaurantId),
      });

      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ["menu-items"],
      });

      toast.success(getLocalizedMessage("message161"));
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || getLocalizedMessage("notification031"));
    },
  });
};

export const useUpdateMenuItemLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateMenuItemLabelParams) =>
      updateMenuItemLabel(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.list(variables.restaurantId),
      });

      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ["menu-items"],
      });

      toast.success(getLocalizedMessage("message163"));
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || getLocalizedMessage("notification083"));
    },
  });
};

export const useDeleteMenuItemLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteMenuItemLabelParams) =>
      deleteMenuItemLabel(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.list(variables.restaurantId),
      });

      queryClient.invalidateQueries({
        queryKey: menuItemLabelKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ["menu-items"],
      });

      toast.success(getLocalizedMessage("message162"));
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || getLocalizedMessage("notification045"));
    },
  });
};