import api from "@/lib/axios";

/**
 * ==============================
 * MENU ITEM LABEL TYPES
 * ==============================
 */

export type MenuItemLabel = {
  value: string;
  label: string;
};

export type GetMenuItemLabelsParams = {
  restaurantId: string;
};

export type CreateMenuItemLabelParams = {
  restaurantId: string;
  payload: MenuItemLabel;
};

export type UpdateMenuItemLabelParams = {
  restaurantId: string;
  value: string;
  payload: MenuItemLabel;
};

export type DeleteMenuItemLabelParams = {
  restaurantId: string;
  value: string;
};

export type MenuItemLabelsResponse = {
  success: boolean;
  data: MenuItemLabel[];
  message?: string;
};

/**
 * ==============================
 * ROUTES
 * ==============================
 */

export const MENU_ITEM_LABEL_ROUTES = {
  base: "/menu/items/labels",

  byValue: (value: string) =>
    `/menu/items/labels/${encodeURIComponent(value)}`,
};

/**
 * ==============================
 * LABEL APIS
 * ==============================
 */

export const getMenuItemLabels = async ({
  restaurantId,
}: GetMenuItemLabelsParams): Promise<MenuItemLabelsResponse> => {
  const { data } = await api.get(MENU_ITEM_LABEL_ROUTES.base, {
    params: {
      restaurantId,
    },
  });

  return data;
};

export const createMenuItemLabel = async ({
  restaurantId,
  payload,
}: CreateMenuItemLabelParams) => {
  const { data } = await api.post(MENU_ITEM_LABEL_ROUTES.base, payload, {
    params: {
      restaurantId,
    },
  });

  return data;
};

export const updateMenuItemLabel = async ({
  restaurantId,
  value,
  payload,
}: UpdateMenuItemLabelParams) => {
  const { data } = await api.patch(
    MENU_ITEM_LABEL_ROUTES.byValue(value),
    payload,
    {
      params: {
        restaurantId,
      },
    }
  );

  return data;
};

export const deleteMenuItemLabel = async ({
  restaurantId,
  value,
}: DeleteMenuItemLabelParams) => {
  const { data } = await api.delete(MENU_ITEM_LABEL_ROUTES.byValue(value), {
    params: {
      restaurantId,
    },
  });

  return data;
};