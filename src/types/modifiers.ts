import type { ApiMeta } from "@/lib/response";

export type ModifierCategorySummary = {
  id: string;
  name: string;
  slug?: string;
};

export type Modifier = {
  id: string;
  restaurantId?: string | null;
  categoryId: string;
  category?: ModifierCategorySummary | null;
  name: string;
  priceDelta?: number;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ModifierListParams = {
  restaurantId?: string;
  categoryId?: string;
  modifierGroupId?: string;
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  inactive?: boolean;
};

export type ModifierCreatePayload = {
  restaurantId: string;
  categoryId: string;
  name: string;
  priceDelta?: number;
  sortOrder?: number;
};

export type ModifierUpdatePayload = {
  categoryId?: string;
  name?: string;
  priceDelta?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type ModifiersMeta = ApiMeta & {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ModifiersListResponse = {
  success?: boolean;
  data: Modifier[];
  meta: ModifiersMeta;
  message?: string;
};
