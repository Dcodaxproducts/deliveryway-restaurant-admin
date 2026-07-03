import type { ApiMeta } from "@/lib/response";

export type Cuisine = {
  id: string;
  restaurantId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CuisineListParams = {
  restaurantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  includeInactive?: boolean;
  all?: boolean;
  inactive?: boolean;
};

export type CuisineCreatePayload = {
  restaurantId?: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CuisineBulkCreatePayload = {
  restaurantId?: string;
  items: Array<{
    name: string;
    slug: string;
    sortOrder?: number;
    isActive?: boolean;
  }>;
};

export type CuisineUpdatePayload = Partial<
  Omit<CuisineCreatePayload, "restaurantId">
>;

export type CuisineReorderPayload = {
  items: Array<{
    id: string;
    sortOrder: number;
  }>;
};

export type CuisinesMeta = ApiMeta & {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type CuisinesListResponse = {
  success?: boolean;
  data: Cuisine[];
  meta: CuisinesMeta;
  message?: string;
};
