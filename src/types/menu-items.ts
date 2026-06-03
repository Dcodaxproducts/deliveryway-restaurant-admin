export type MenuItemsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  restaurantId?: string;
  branchId?: string;
  categoryId?: string;
  menuId?: string;
  includeAll?: boolean;
  inactive?: boolean;
};
