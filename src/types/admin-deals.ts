export type AdminDealSelectionMode = "FIXED_ITEMS" | "FLEXIBLE_ITEMS";

export type AdminDealLifecycle =
  | "active"
  | "scheduled"
  | "expired"
  | "inactive"
  | string;

export type AdminDealSourceType = "ITEMS" | "CATEGORIES";
export type AdminDealKind = "FIXED_PRICE" | "ITEM_DEAL" | "BUNDLE" | string;
export type AdminDealDiscountType = "FIXED_PRICE" | "PERCENTAGE" | "FLAT" | string;

export type AdminDealMenuItemSummary = {
  id: string;
  name: string;
  imageUrl?: string | null;
  basePrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
};

export type AdminDealCategorySummary = {
  id: string;
  name: string;
  imageUrl?: string | null;
  slug?: string | null;
};

export type AdminDeal = {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  dealSelectionMode: AdminDealSelectionMode;
  dealRequiredQuantity?: number | null;
  scopeMenuItemIds: string[];
  scopeCategoryIds: string[];
  scopeMenuItems?: AdminDealMenuItemSummary[];
  scopeCategories?: AdminDealCategorySummary[];
  autoApply?: boolean;
  isActive: boolean;
  lifecycle?: AdminDealLifecycle;
  kind?: AdminDealKind;
  discountType?: AdminDealDiscountType;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type AdminDealsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type AdminDealsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  lifecycle?: string;
};

export type AdminDealsListResponse = {
  deals: AdminDeal[];
  meta: AdminDealsMeta;
  message?: string;
};

export type AdminDealFormValues = {
  title: string;
  description?: string;
  restaurantId?: string;
  branchId?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  discountValue: number;
  startsAt?: string;
  expiresAt?: string;
  dealSelectionMode: AdminDealSelectionMode;
  dealSourceType: AdminDealSourceType;
  dealRequiredQuantity?: number | null;
  scopeMenuItemIds: string[];
  scopeCategoryIds: string[];
  isActive: boolean;
};

export type AdminDealCreatePayload = {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  restaurantId?: string;
  branchId?: string;
  discountValue: number;
  startsAt?: string;
  expiresAt?: string;
  dealSelectionMode: AdminDealSelectionMode;
  dealRequiredQuantity?: number;
  scopeMenuItemIds?: string[];
  scopeCategoryIds?: string[];
  isActive: boolean;
};

export type AdminDealUpdatePayload = Partial<AdminDealCreatePayload> & {
  scopeMenuItemIds?: string[];
  scopeCategoryIds?: string[];
};

export type AdminDealStats = {
  dealId?: string;
  totalUses?: number;
  totalDiscountAmount?: number;
  totalRevenue?: number;
  orderCount?: number;
  customerCount?: number;
  [key: string]: unknown;
};
