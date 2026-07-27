export const resolveMenuRestaurantId = (
  authenticatedRestaurantId?: string | null,
  userRestaurantId?: string | null,
  formRestaurantId?: string | null,
) =>
  authenticatedRestaurantId?.trim() ||
  userRestaurantId?.trim() ||
  formRestaurantId?.trim() ||
  undefined;
