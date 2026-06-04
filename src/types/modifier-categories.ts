import type { ApiMeta } from "@/lib/response";

export type ModifierCategory = {
  id: string;
  restaurantId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ModifierCategoryListParams = {
  restaurantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  inactive?: boolean;
};

export type ModifierCategoryCreatePayload = {
  restaurantId?: string;
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
};

export type ModifierCategoryUpdatePayload = {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type ModifierCategoriesMeta = ApiMeta & {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ModifierCategoriesListResponse = {
  success?: boolean;
  data: ModifierCategory[];
  meta: ModifierCategoriesMeta;
  message?: string;
};
