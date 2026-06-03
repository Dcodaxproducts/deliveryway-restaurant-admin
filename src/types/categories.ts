import type { ApiMeta } from "@/lib/response";

export type MenuCategoryListParams = {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  parentCategoryId?: string;
  inactive?: boolean;
  menuId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  includeInactive?: boolean;
};

export type MenuCategoryOption = {
  id: string;
  name: string;
  imageUrl?: string | null;
  slug?: string | null;
  itemCount?: number;
};

export type MenuCategoriesListResponse = {
  data: MenuCategoryOption[];
  meta: ApiMeta | null;
};
