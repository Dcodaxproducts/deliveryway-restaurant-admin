export type GlobalSearchEntity =
  | "orders"
  | "menuItems"
  | "customers"
  | "branches"
  | "deliverymen"
  | "employees"
  | "promotions"
  | "deals"
  | "tableReservations"
  | "restaurants"
  | "faqs";

export type GlobalSearchResult = {
  id: string;
  entity: GlobalSearchEntity;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  href: string;
  avatarUrl?: string | null;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export type GlobalSearchGroup = {
  entity: GlobalSearchEntity;
  label: string;
  href: string;
  results: GlobalSearchResult[];
  total?: number;
};

export type GlobalSearchParams = {
  query: string;
  restaurantId?: string;
  branchId?: string;
  limit?: number;
};

export type GlobalSearchResponse = {
  groups: GlobalSearchGroup[];
  total: number;
};
