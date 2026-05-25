import api from "@/lib/axios";

export type InventoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
};

export type CreateInventoryMovementPayload = {
  restaurantId?: string;
  branchId: string;
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason?: string;
  note?: string;
};

export const getInventoryCategories = async (params?: InventoryListParams) => {
  const { data } = await api.get("/inventory/categories", { params });
  return data;
};

export const getInventoryItems = async (params?: InventoryListParams) => {
  const { data } = await api.get("/inventory/items", { params });
  return data;
};

export const getInventoryMovements = async (params?: InventoryListParams) => {
  const { data } = await api.get("/inventory/movements", { params });
  return data;
};

export const createInventoryMovement = async (
  payload: CreateInventoryMovementPayload
) => {
  const { data } = await api.post("/inventory/movements", payload);
  return data;
};

export const getInventoryRecipes = async (params?: InventoryListParams) => {
  const { data } = await api.get("/inventory/recipes", { params });
  return data;
};
