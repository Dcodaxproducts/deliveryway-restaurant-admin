import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addItemToMenu,
  attachModifierGroupToCategory,
  attachModifierGroupToItem,
  bulkCreateMenuItems,
  createMenu,
  createMenuItem,
  CreateMenuPayload,
  createMenuVariation,
  createModifier,
  createModifierGroup,
  createRestaurantMenu,
  deleteMenuItem,
  deleteMenuItemLink,
  deleteMenuVariation,
  deleteModifier,
  deleteModifierGroup,
  deleteRestaurantMenu,
  duplicateMenuItem,
  duplicateModifier,
  getCategoryModifierGroups,
  getMenuById,
  getMenuItems,
  getMenuItemsByMenu,
  getMenuVariations,
  getModifierGroups,
  getModifiers,
  getRestaurantMenu,
  getRestaurantMenus,
  reorderMenuItems,
  updateMenu,
  updateMenuItem,
  updateMenuItemLink,
  UpdateMenuPayload,
  updateMenuVariation,
  updateModifier,
  updateModifierGroup,
  updateRestaurantMenu,
  upsertMenuItemBranchOverride,
  type MenuItemBranchOverridePayload,
} from "@/services/menu/menu.api";
import { GetMenuVariationsParams, UpdateMenuVariationValues } from "@/validations/menus";

/**
 * ==============================
 * MENU ITEMS HOOKS
 * ==============================
 */

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu item created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create menu item");
    },
  });
};
export const useGetMenuItems = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  categoryId?: string;
  menuId?: string;
  includeAll?: boolean;
  inactive?: boolean;
}) => {
  return useQuery({
    queryKey: [
      "menu-items",
      params?.page,
      params?.limit,
      params?.search,
      params?.restaurantId,
      params?.branchId,
      params?.categoryId,
      params?.menuId,
      params?.includeAll,
      params?.inactive,
    ],
    queryFn: () => getMenuItems(params),
  });
};



export const useUpsertMenuItemBranchOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MenuItemBranchOverridePayload) =>
      upsertMenuItemBranchOverride(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Branch menu item override saved");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to save branch item override"
      );
    },
  });
};

export const useBulkCreateMenuItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkCreateMenuItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu items created successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to bulk create menu items"
      );
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateMenuItem(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-item", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu item updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update menu item");
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu item deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete menu item");
    },
  });
};

/**
 * ==============================
 * MENU VARIATIONS HOOKS
 * ==============================
 */
export const useCreateMenuVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMenuVariation,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-variations"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });

      toast.success("Menu variation created successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create menu variation"
      );
    },
  });
};

export const useGetMenuVariations = (
  params?: GetMenuVariationsParams
) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );

  return useQuery({
    queryKey: ["menu-variations", cleanParams],
    queryFn: () => getMenuVariations(params),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useUpdateMenuVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMenuVariationValues;
    }) => updateMenuVariation(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-variations"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });

      toast.success("Menu variation updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update menu variation"
      );
    },
  });
};

export const useDeleteMenuVariation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMenuVariation,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-variations"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });

      toast.success("Menu variation deleted successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to delete menu variation"
      );
    },
  });
};
/**
 * ==============================
 * MODIFIER GROUPS HOOKS
 * ==============================
 */

export const useCreateModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModifierGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group created successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create modifier group"
      );
    },
  });
};

export const useGetModifierGroups = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
}) => {
  return useQuery({
    queryKey: [
      "modifier-groups",
      params?.page,
      params?.limit,
      params?.search,
      params?.restaurantId,
    ],
    queryFn: () => getModifierGroups(params),
    enabled: !!params?.restaurantId, //  prevent call without restaurant
  });
};

export const useGetCategoryModifierGroups = (categoryId?: string) => {
  return useQuery({
    queryKey: ["category-modifier-groups", categoryId],
    queryFn: () => getCategoryModifierGroups(categoryId as string),
    enabled: !!categoryId,
  });
};

export const useUpdateModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateModifierGroup(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update modifier group"
      );
    },
  });
};

export const useDeleteModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModifierGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to delete modifier group"
      );
    },
  });
};

/**
 * ==============================
 * MODIFIERS HOOKS
 * ==============================
 */

export const useCreateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create modifier");
    },
  });
};


export const useGetModifiers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  modifierGroupId?: string;
  restaurantId?: string;
}) => {
  return useQuery({
    queryKey: [
      "modifiers",
      params?.page,
      params?.limit,
      params?.search,
      params?.modifierGroupId,
      params?.restaurantId,
    ],
    queryFn: () => getModifiers(params),
    enabled: !!params?.restaurantId, //  prevents call without restaurant
  });
};
export const useUpdateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateModifier(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update modifier");
    },
  });
};

export const useDeleteModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete modifier");
    },
  });
};

/**
 * ==============================
 * ATTACH MODIFIER GROUP TO ITEM
 * ==============================
 */

export const useAttachModifierGroupToItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      groupId,
    }: {
      itemId: string;
      groupId: string;
    }) => attachModifierGroupToItem(itemId, groupId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group attached successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to attach modifier group to item"
      );
    },
  });
};

/**
 * ==============================
 * RESTAURANT MENUS HOOKS
 * ==============================
 */

export const useCreateRestaurantMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRestaurantMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create menu");
    },
  });
};

export const useGetRestaurantMenus = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  isActive?: boolean;
  isDefault?: boolean;
}) => {
  return useQuery({
    queryKey: [
      "menus",
      params?.page,
      params?.limit,
      params?.search,
      params?.restaurantId,
      params?.isActive,
      params?.isDefault,
    ],
    queryFn: () => getRestaurantMenus(params),
  });
};

export const useGetRestaurantMenu = (id: string) => {
  return useQuery({
    queryKey: ["menus", id],
    queryFn: () => getRestaurantMenu(id),
    enabled: !!id,
  });
};

export const useUpdateRestaurantMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateRestaurantMenu(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menus", variables.id] });
      toast.success("Menu updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update menu");
    },
  });
};

export const useDeleteRestaurantMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRestaurantMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete menu");
    },
  });
};

/**
 * ==============================
 * MENU <-> ITEM LINKS HOOKS
 * ==============================
 */

export const useAddItemToMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      data,
    }: {
      menuId: string;
      data: any;
    }) => addItemToMenu(menuId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items-by-menu", variables.menuId] });
      toast.success("Item added to menu successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add item to menu");
    },
  });
};

export const useGetMenuItemsByMenu = (
  menuId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: boolean;
  }
) => {
  return useQuery({
    queryKey: [
      "menu-items-by-menu",
      menuId,
      params?.page,
      params?.limit,
      params?.search,
      params?.isAvailable,
    ],
    queryFn: () => getMenuItemsByMenu(menuId, params),
    enabled: !!menuId,
  });
};

export const useUpdateMenuItemLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      linkId,
      data,
    }: {
      menuId: string;
      linkId: string;
      data: any;
    }) => updateMenuItemLink(menuId, linkId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-items-by-menu", variables.menuId],
      });
      toast.success("Linked menu item updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update linked menu item"
      );
    },
  });
};

export const useDeleteMenuItemLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      linkId,
    }: {
      menuId: string;
      linkId: string;
    }) => deleteMenuItemLink(menuId, linkId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-items-by-menu", variables.menuId],
      });
      toast.success("Item removed from menu successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to remove item from menu"
      );
    },
  });
};

export const useAttachModifierGroupToCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      groupId,
      sortOrder = 0,
    }: {
      categoryId: string;
      groupId: string;
      sortOrder?: number;
    }) =>
      attachModifierGroupToCategory(categoryId, groupId, {
        sortOrder,
      }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({
        queryKey: ["modifier-groups-by-category", variables.categoryId],
      });
      queryClient.invalidateQueries({
        queryKey: ["menu-categories"],
      });
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to attach modifier group to category"
      );
    },
  });
};

/* =========================
   GET SINGLE MENU
========================= */
export const useGetMenuById = (menuId?: string) => {
  return useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => getMenuById(menuId as string),
    enabled: !!menuId,
  });
};

/* =========================
   CREATE MENU
========================= */
export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => createMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};

/* =========================
   UPDATE MENU
========================= */
export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      menuId,
      payload,
    }: {
      menuId: string;
      payload: UpdateMenuPayload;
    }) => updateMenu({ menuId, payload }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["menu", variables.menuId] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    },
  });
};



export const useDuplicateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateModifier,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      toast.success("Modifier duplicated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to duplicate modifier"
      );
    },
  });
};


export const useDuplicateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateMenuItem,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["menu-item"] });

      toast.success("Menu item duplicated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to duplicate menu item"
      );
    },
  });
};

// hooks
export const useReorderMenuItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderMenuItems,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu items reordered successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to reorder menu items"
      );
    },
  });
};
