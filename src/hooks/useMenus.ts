import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cleanParams } from "@/lib/params";
import type { MenuItemsListParams } from "@/types/menu-items";
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
      toast.success(getLocalizedMessage("message201"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification034"));
    },
  });
};
export const useGetMenuItems = (params?: MenuItemsListParams) => {
  return useQuery({
    queryKey: [
      "menu-items",
      params?.page,
      params?.limit,
      params?.search,
      params?.sortBy,
      params?.sortOrder,
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
      toast.success(getLocalizedMessage("message057"));
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification070")
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
      toast.success(getLocalizedMessage("message205"));
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification025")
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
      toast.success(getLocalizedMessage("message204"));
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification089"));
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
      toast.success(getLocalizedMessage("message202"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification048"));
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

      toast.success(getLocalizedMessage("message208"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification035")
      );
    },
  });
};

export const useGetMenuVariations = (
  params?: GetMenuVariationsParams
) => {
  const queryParams = cleanParams(params);

  return useQuery({
    queryKey: ["menu-variations", queryParams],
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

      toast.success(getLocalizedMessage("message210"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification090")
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

      toast.success(getLocalizedMessage("message209"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification049")
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
      toast.success(getLocalizedMessage("message227"));
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification038")
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
      toast.success(getLocalizedMessage("message229"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification093")
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
      toast.success(getLocalizedMessage("message228"));
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification052")
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
      toast.success(getLocalizedMessage("message220"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification036"));
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
      toast.success(getLocalizedMessage("message231"));
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification091"));
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
      toast.success(getLocalizedMessage("message221"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification050"));
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
      toast.success(getLocalizedMessage("message226"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          getLocalizedMessage("notification023")
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
      toast.success(getLocalizedMessage("message198"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification032"));
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
      toast.success(getLocalizedMessage("message207"));
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification087"));
    },
  });
};

export const useDeleteRestaurantMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRestaurantMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success(getLocalizedMessage("message199"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification046"));
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
      toast.success(getLocalizedMessage("message156"));
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification012"));
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
      toast.success(getLocalizedMessage("message172"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification085")
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
      toast.success(getLocalizedMessage("message157"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification066")
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
          getLocalizedMessage("notification022")
      );
    },
  });
};

export const useGetMenuById = (menuId?: string) => {
  return useQuery({
    queryKey: ["menu", menuId],
    queryFn: () => getMenuById(menuId as string),
    enabled: !!menuId,
  });
};

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
      toast.success(getLocalizedMessage("message223"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || getLocalizedMessage("notification059")
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

      toast.success(getLocalizedMessage("message203"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || getLocalizedMessage("notification058")
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
      toast.success(getLocalizedMessage("message206"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || getLocalizedMessage("notification068")
      );
    },
  });
};

export const useAttachModifierGroupToItemWithSort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, groupId, sortOrder }: { itemId: string; groupId: string; sortOrder?: number }) =>
      attachModifierGroupToItem(itemId, groupId, sortOrder !== undefined ? { sortOrder } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success(getLocalizedMessage("message226"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || getLocalizedMessage("notification023"));
    },
  });
};
