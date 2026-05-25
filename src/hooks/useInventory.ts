import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInventoryMovement,
  getInventoryCategories,
  getInventoryItems,
  getInventoryMovements,
  getInventoryRecipes,
  type CreateInventoryMovementPayload,
  type InventoryListParams,
} from "@/services/inventory/inventory.api";

export const useInventoryItems = (params?: InventoryListParams) =>
  useQuery({
    queryKey: ["inventory-items", params],
    queryFn: () => getInventoryItems(params),
    enabled: Boolean(params?.restaurantId && params?.branchId),
  });

export const useInventoryCategories = (params?: InventoryListParams) =>
  useQuery({
    queryKey: ["inventory-categories", params],
    queryFn: () => getInventoryCategories(params),
    enabled: Boolean(params?.restaurantId && params?.branchId),
  });

export const useInventoryMovements = (params?: InventoryListParams) =>
  useQuery({
    queryKey: ["inventory-movements", params],
    queryFn: () => getInventoryMovements(params),
    enabled: Boolean(params?.restaurantId && params?.branchId),
  });

export const useInventoryRecipes = (params?: InventoryListParams) =>
  useQuery({
    queryKey: ["inventory-recipes", params],
    queryFn: () => getInventoryRecipes(params),
    enabled: Boolean(params?.restaurantId && params?.branchId),
  });

export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryMovementPayload) =>
      createInventoryMovement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      toast.success("Inventory movement recorded");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to record inventory movement"
      );
    },
  });
};
