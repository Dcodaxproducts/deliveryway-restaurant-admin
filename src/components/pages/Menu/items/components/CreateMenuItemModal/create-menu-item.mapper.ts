import type { CreateMenuItemFormValues } from "./create-menu-item.schema";

export const mapCreateMenuItemFormToPayload = (values: CreateMenuItemFormValues) => ({
  ...values,
  basePrice: Number(values.basePrice || 0),
});
