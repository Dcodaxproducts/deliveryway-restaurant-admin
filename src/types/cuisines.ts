import type { ApiMeta } from "@/lib/response";

export type Cuisine = {
  id: string;
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
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  includeInactive?: boolean;
  all?: boolean;
  inactive?: boolean;
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
