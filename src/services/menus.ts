import api from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import type { MenuItemsListParams } from "@/types/menu-items";
import {
  BulkMenuItemsValues,
  GetMenuVariationsParams,
  LinkMenuItemValues,
  MenuItemValues,
  MenuVariationValues,
  ModifierGroupValues,
  ModifierValues,
  RestaurantMenuValues,
  UpdateLinkedMenuItemValues,
  UpdateMenuItemValues,
  UpdateMenuVariationValues,
  UpdateModifierGroupValues,
  UpdateModifierValues,
  UpdateRestaurantMenuValues,
} from "@/validations/menus";

/**
 * ==============================
 * MENU ITEMS APIS
 * ==============================
 */

export const createMenuItem = async (payload: MenuItemValues) => {
  const { data } = await api.post("/menu/items", payload);
  return data;
};

export const getMenuItems = async (params?: MenuItemsListParams) => {
  // The menu catalog list endpoints are restaurant/catalog reads.
  // Backend validation rejects branchId here; branch-specific behavior is handled by JWT scope
  // and the /menu/branch-overrides/* endpoints.
  const allowedParams = { ...params };
  delete allowedParams.branchId;

  const { data } = await api.get("/menu/items", {
    params: cleanParams(allowedParams),
  });
  return data;
};


export const bulkCreateMenuItems = async (payload: BulkMenuItemsValues) => {
  const { data } = await api.post("/menu/items/bulk", payload);
  return data;
};

export const updateMenuItem = async (
  id: string,
  payload: Partial<UpdateMenuItemValues>
) => {
  const { data } = await api.patch(`/menu/items/${id}`, payload);
  return data;
};

export const deleteMenuItem = async (id: string) => {
  const { data } = await api.delete(`/menu/items/${id}`);
  return data;
};

/**
 * ==============================
 * MENU VARIATIONS APIS
 * ==============================
 */
export const createMenuVariation = async (payload: MenuVariationValues) => {
  const { data } = await api.post("/menu/variations", payload);
  return data;
};

export const getMenuVariations = async (
  params?: GetMenuVariationsParams
) => {
  const response = await api.get("/menu/variations", {
    params: cleanParams(params),
  });

  return response.data;
};

export const updateMenuVariation = async (
  id: string,
  payload: UpdateMenuVariationValues
) => {
  const { data } = await api.patch(`/menu/variations/${id}`, payload);
  return data;
};

export const deleteMenuVariation = async (id: string) => {
  const { data } = await api.delete(`/menu/variations/${id}`);
  return data;
};

/**
 * ==============================
 * MODIFIER GROUPS APIS
 * ==============================
 */

export const createModifierGroup = async (payload: ModifierGroupValues) => {
  const { data } = await api.post("/menu/modifier-groups", payload);
  return data;
};

export const getModifierGroups = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) => {
  const { data } = await api.get("/menu/modifier-groups", { params });
  return data;
};

export const getCategoryModifierGroups = async (categoryId: string) => {
  const { data } = await api.get(
    `/menu/categories/${categoryId}/modifier-groups`
  );

  return data;
};

export const updateModifierGroup = async (
  id: string,
  payload: Partial<UpdateModifierGroupValues>
) => {
  const { data } = await api.patch(`/menu/modifier-groups/${id}`, payload);
  return data;
};

export const deleteModifierGroup = async (id: string) => {
  const { data } = await api.delete(`/menu/modifier-groups/${id}`);
  return data;
};

/**
 * ==============================
 * MODIFIERS APIS
 * ==============================
 */

export const createModifier = async (payload: ModifierValues) => {
  const { data } = await api.post("/menu/modifiers", payload);
  return data;
};

export const getModifiers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  modifierGroupId?: string;
  isActive?: boolean;
}) => {
  const { data } = await api.get("/menu/modifiers", { params });
  return data;
};

export const updateModifier = async (
  id: string,
  payload: Partial<UpdateModifierValues>
) => {
  const { data } = await api.patch(`/menu/modifiers/${id}`, payload);
  return data;
};

export const deleteModifier = async (id: string) => {
  const { data } = await api.delete(`/menu/modifiers/${id}`);
  return data;
};

export const attachModifierGroupToItem = async (
  itemId: string,
  groupId: string,
  payload?: { sortOrder?: number }
) => {
  const { data } = await api.post(
    `/menu/items/${itemId}/modifier-groups/${groupId}`,
    payload
  );
  return data;
};

/**
 * ==============================
 * RESTAURANT MENUS APIS
 * ==============================
 */

export const createRestaurantMenu = async (payload: RestaurantMenuValues) => {
  const { data } = await api.post("/menus", payload);
  return data;
};

export const getRestaurantMenus = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  isActive?: boolean;
  isDefault?: boolean;
}) => {
  const allowedParams = { ...(params as Record<string, any> | undefined) };
  delete allowedParams.branchId;

  const { data } = await api.get("/menus", {
    params: cleanParams(allowedParams),
  });
  return data;
};

export const getRestaurantMenu = async (id: string) => {
  const { data } = await api.get(`/menus/${id}`);
  return data?.data ?? data;
};

export const updateRestaurantMenu = async (
  id: string,
  payload: Partial<UpdateRestaurantMenuValues>
) => {
  const { data } = await api.patch(`/menus/${id}`, payload);
  return data;
};

export const deleteRestaurantMenu = async (id: string) => {
  const { data } = await api.delete(`/menus/${id}`);
  return data;
};

/**
 * ==============================
 * MENU <-> ITEM LINK APIS
 * ==============================
 */

export const addItemToMenu = async (menuId: string, payload: LinkMenuItemValues) => {
  const { data } = await api.post(`/menus/${menuId}/items`, payload);
  return data;
};

export const getMenuItemsByMenu = async (
  menuId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: boolean;
  }
) => {
  const { data } = await api.get(`/menus/${menuId}/items`, { params });
  return data;
};

export const updateMenuItemLink = async (
  menuId: string,
  linkId: string,
  payload: Partial<UpdateLinkedMenuItemValues>
) => {
  const { data } = await api.patch(`/menus/${menuId}/items/${linkId}`, payload);
  return data;
};

export const deleteMenuItemLink = async (menuId: string, linkId: string) => {
  const { data } = await api.delete(`/menus/${menuId}/items/${linkId}`);
  return data;
};


export const attachModifierGroupToCategory = async (
  categoryId: string,
  groupId: string,
  body: { sortOrder: number }
) => {
  const { data } = await api.post(
    `/menu/categories/${categoryId}/modifier-groups/${groupId}`,
    body
  );
  return data;
};


export const getMenuById = async (menuId: string) => {
  const { data } = await api.get(`/menus/${menuId}`);
  return data;
};

export interface CreateMenuPayload {
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  itemIds?: string[];
  isActive?: boolean;
}

export const createMenu = async (payload: CreateMenuPayload) => {
  const { data } = await api.post("/menus", payload);
  return data;
};

export interface UpdateMenuPayload {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  itemIds?: string[];
  isActive?: boolean;
}

export const updateMenu = async ({
  menuId,
  payload,
}: {
  menuId: string;
  payload: UpdateMenuPayload;
}) => {
  const { data } = await api.patch(`/menus/${menuId}`, payload);
  return data;
};

export const duplicateModifier = async (modifierId: string) => {
  const { data } = await api.post(`/menu/modifiers/${modifierId}/duplicate`);
  return data;
};

export const duplicateMenuItem = async (menuItemId: string) => {
  const { data } = await api.post(`/menu/items/${menuItemId}/duplicate`);
  return data;
};

export const reorderMenuItems = async (payload: {
  items: {
    id: string;
    sortOrder: number;
  }[];
}) => {
  const { data } = await api.patch("/menu/items/reorder", payload);
  return data;
};


export type MenuItemBranchOverridePayload = {
  branchId: string;
  menuItemId: string;
  isAvailable?: boolean;
  price?: number | null;
  reason?: string;
};

export const upsertMenuItemBranchOverride = async (
  payload: MenuItemBranchOverridePayload
) => {
  const { data } = await api.post("/menu/branch-overrides/items", payload);
  return data;
};
