import api from "@/lib/axios";
import {
  BulkMenuCategoriesValues,
  MenuCategoryValues,
  UpdateMenuCategoryValues,
} from "@/validations/categories";

const compactParams = (params?: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );
};

/**
 * ==============================
 * MENU CATEGORIES APIS
 * ==============================
 */

export const createMenuCategory = async (payload: MenuCategoryValues) => {
  const { data } = await api.post("/menu/categories", payload);
  return data;
};


export const getMenuCategories = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  parentCategoryId?: string;
  inactive?: boolean;
  menuId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  includeInactive?: boolean;
}) => {
  // Do not send branchId to the category list endpoint. Branch admins are scoped by JWT,
  // and branch category changes go through /menu/branch-overrides/categories.
  const { branchId: _branchId, ...allowedParams } = params || {};
  const { data } = await api.get("/menu/categories", {
    params: compactParams(allowedParams),
  });
  return data;
};

export const bulkCreateMenuCategories = async (
  payload: BulkMenuCategoriesValues
) => {
  const { data } = await api.post("/menu/categories/bulk", payload);
  return data;
};

export const updateMenuCategory = async (
  id: string,
  payload: Partial<UpdateMenuCategoryValues>
) => {
  const { data } = await api.patch(`/menu/categories/${id}`, payload);
  return data;
};

export const deleteMenuCategory = async (id: string) => {
  const { data } = await api.delete(`/menu/categories/${id}`);
  return data;
};

export const getModifierGroupCategories = async (groupId: string) => {
  if (!groupId) throw new Error("groupId is required");

  const { data } = await api.get(`/menu/modifier-groups/${groupId}/categories`);

  return data;
};

export const getMenuCategoryById = async (id: string) => {
  if (!id) throw new Error("category id is required");

  const { data } = await api.get(`/menu/categories/${id}`);

  return data;
};


export const reorderMenuCategories = async (payload: {
  items: {
    id: string;
    sortOrder: number;
  }[];
}) => {
  const { data } = await api.patch("/menu/categories/reorder", payload);
  return data;
};

export type MenuCategoryBranchOverridePayload = {
  branchId: string;
  categoryId: string;
  isAvailable?: boolean;
  reason?: string;
};

export const upsertMenuCategoryBranchOverride = async (
  payload: MenuCategoryBranchOverridePayload
) => {
  const { data } = await api.post("/menu/branch-overrides/categories", payload);
  return data;
};
