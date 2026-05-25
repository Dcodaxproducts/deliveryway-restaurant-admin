import type { AddToCartFormValues } from "../schemas/add-to-cart.schema";

export const mapAddToCartPayload = (values: AddToCartFormValues) => ({
  ...values,
  quantity: Number(values.quantity || 1),
});
