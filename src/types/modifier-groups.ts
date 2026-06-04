import type { ApiMeta } from "@/lib/response";

export type ModifierGroupModifier = {
  id: string;
  name: string;
  priceDelta?: string | number | null;
  sortOrder?: number;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
};

export type ModifierGroup = {
  id: string;
  restaurantId?: string | null;
  name: string;
  description?: string | null;
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: ModifierGroupModifier[];
  createdAt?: string;
  updatedAt?: string;
};

export type ModifierGroupListParams = {
  restaurantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
  inactive?: boolean;
};

export type ModifierGroupCreatePayload = {
  restaurantId: string;
  name: string;
  description?: string | null;
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
};

export type ModifierGroupUpdatePayload = {
  name?: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type AttachModifierToGroupPayload = {
  sortOrder?: number;
};

export type ModifierGroupsMeta = ApiMeta & {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ModifierGroupsListResponse = {
  success?: boolean;
  data: ModifierGroup[];
  meta: ModifierGroupsMeta;
  message?: string;
};
