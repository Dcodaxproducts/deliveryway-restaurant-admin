import {
  buildMenuItemPayload,
  getInitialForm,
} from "@/components/pages/Menu/legacy/items/CreateMenuItemModalLegacy/CreateMenuItemModal";
import type { UpdateMenuItemValues } from "@/validations/menus";

type MenuItemRecord = Record<string, unknown> & { id?: unknown };

type MenuItemStatusPayload = Partial<UpdateMenuItemValues>;

type UpdateMenuItem = (
  id: string,
  payload: MenuItemStatusPayload,
) => Promise<unknown>;

export const getMenuItemActive = (item: MenuItemRecord) => {
  const branchOverride = item.branchOverride as
    | { isAvailable?: unknown }
    | null
    | undefined;
  const branchOverrides = item.branchOverrides as
    | Array<{ isAvailable?: unknown }>
    | undefined;

  return Boolean(
    branchOverride?.isAvailable ??
      branchOverrides?.[0]?.isAvailable ??
      item.isAvailable ??
      item.isActive,
  );
};

export const buildMenuItemStatusPayload = ({
  item,
  restaurantId,
  isActive,
}: {
  item: MenuItemRecord;
  restaurantId?: string;
  isActive: boolean;
}) => {
  const form = {
    ...getInitialForm(restaurantId, item),
    isActive,
  };
  const payload = buildMenuItemPayload({
    form,
    restaurantId,
    initialDataId: String(item.id ?? ""),
  });

  // Match the edit modal contract: restaurant scope comes from the authenticated request.
  const { restaurantId: _restaurantId, ...updatePayload } = payload;
  return updatePayload as unknown as MenuItemStatusPayload;
};

export const updateMenuItemStatus = async ({
  item,
  restaurantId,
  isActive,
  update,
}: {
  item: MenuItemRecord;
  restaurantId?: string;
  isActive: boolean;
  update: UpdateMenuItem;
}) => {
  const id = String(item.id ?? "");
  if (!id) {
    throw new Error("Menu item id is required");
  }

  const payload = buildMenuItemStatusPayload({ item, restaurantId, isActive });
  await update(id, payload);
  return { id, isActive, payload };
};
