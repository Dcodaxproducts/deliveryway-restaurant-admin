export type AdminDealSortOrder = "ASC" | "DESC";

export type AdminDealLifecycle =
  | "UPCOMING"
  | "ACTIVE"
  | "EXPIRED"
  | "ENDED"
  | "DELETED"
  | "INACTIVE"
  | string;

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

export type AdminDeal = {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  startsAt: string;
  expiresAt: string;
  scopeMenuItemIds: string[];
  scopeMenuItems?: AdminDealMenuItemSummary[];
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
  sortBy?: string;
  sortOrder?: AdminDealSortOrder;
  withDeleted?: boolean;
  includeInactive?: boolean;
  restaurantId?: string;
  branchId?: string;
  kind?: string;
  discountType?: string;
  lifecycle?: string;
};

export type AdminDealsListResponse = {
  deals: AdminDeal[];
  meta: AdminDealsMeta;
  message?: string;
};

export type AdminDealFormValues = {
  code?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  restaurantId?: string;
  branchId?: string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerCustomer?: number | null;
  startsAt: string;
  expiresAt: string;
  scopeMenuItemIds: string[];
  isActive: boolean;
};

export type AdminDealCreatePayload = {
  code?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  restaurantId?: string;
  branchId?: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  startsAt: string;
  expiresAt: string;
  scopeMenuItemIds: string[];
  autoApply: true;
  isActive: boolean;
};

export type AdminDealUpdatePayload = Partial<AdminDealCreatePayload>;

export type AdminDealStats = {
  dealId?: string;
  totalUses?: number;
  totalDiscountAmount?: number;
  totalRevenue?: number;
  orderCount?: number;
  customerCount?: number;
  [key: string]: unknown;
};
