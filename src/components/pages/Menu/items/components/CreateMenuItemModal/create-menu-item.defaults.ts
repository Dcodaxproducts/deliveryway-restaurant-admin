import type { CreateMenuItemFormValues } from "./create-menu-item.schema";

export const createMenuItemDefaults: CreateMenuItemFormValues = {
  name: "",
  description: "",
  basePrice: 0,
  categoryIds: [],
  isActive: true,
};
