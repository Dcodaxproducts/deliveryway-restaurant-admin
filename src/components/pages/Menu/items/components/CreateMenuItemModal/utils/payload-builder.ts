import { mapCreateMenuItemFormToPayload } from "../create-menu-item.mapper";
import type { CreateMenuItemFormValues } from "../create-menu-item.schema";

export const buildCreateMenuItemPayload = (values: CreateMenuItemFormValues) =>
  mapCreateMenuItemFormToPayload(values);
