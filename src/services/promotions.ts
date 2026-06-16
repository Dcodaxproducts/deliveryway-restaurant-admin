import api from "@/lib/axios";

export type PromotionQueryParams = {
  restaurantId?: string | null;
  branchId?: string | null;
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
};

export type PromotionIdPayload = {
  id: string;
};

export type PromotionCampaignPayload = {
  code?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  restaurantId?: string | null;
  branchId?: string | null;

  discountType: "FLAT" | "PERCENTAGE" | string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;

  startsAt: string | null;
  expiresAt?: string | null;

  scopeMenuItemId?: string | null;
  scopeCategoryId?: string | null;
  scopeMenuItemIds?: string[];
  scopeCategoryIds?: string[];
  applyMode?: "ORDER_TOTAL" | "SCOPED_ITEMS" | string;
  autoApply?: boolean;

  isActive?: boolean;
};

export type HappyHourPayload = {
  code: string;
  title: string;
  description?: string;
  restaurantId?: string | null;
  branchId?: string | null;

  discountType: "FLAT" | "PERCENTAGE" | string;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;

  startsAt: string | null;
  expiresAt?: string | null;

  scopeMenuItemId?: string | null;
  scopeCategoryId?: string | null;
  scopeMenuItemIds?: string[];
  scopeCategoryIds?: string[];
  applyMode?: "ORDER_TOTAL" | "SCOPED_ITEMS" | string;
  autoApply?: boolean;

  isActive?: boolean;

  activeDays?: number[];
  dailyStartTime?: string;
  dailyEndTime?: string;
};

const buildPromotionParams = (params?: PromotionQueryParams) => {
  return {
    ...(params?.restaurantId ? { restaurantId: params.restaurantId } : {}),
    ...(params?.branchId ? { branchId: params.branchId } : {}),
    ...(params?.search ? { search: params.search } : {}),
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.type ? { type: params.type } : {}),
    ...(params?.page ? { page: params.page } : {}),
    ...(params?.limit ? { limit: params.limit } : {}),
  };
};

/**
 * Overview
 */
export const getAdminPromotionsOverview = async (
  params?: PromotionQueryParams
) => {
  const response = await api.get("/admin/promotions/overview", {
    params: buildPromotionParams(params),
  });

  return response.data;
};

/**
 * Campaigns
 */
export const getAdminPromotionCampaigns = async (
  params?: PromotionQueryParams
) => {
  const response = await api.get("/admin/promotions/campaigns", {
    params: buildPromotionParams(params),
  });

  return response.data;
};
export const getAdminPromotionCampaignDetail = async (
  id: string,
  params?: PromotionQueryParams
) => {
  const response = await api.get(`/admin/promotions/campaigns/${id}`, {
    params: buildPromotionParams(params),
  });

  return response.data;
};
export const createAdminPromotionCampaign = async (
  payload: PromotionCampaignPayload
) => {
  const response = await api.post("/admin/promotions/campaigns", payload);

  return response.data;
};
export const updateAdminPromotionCampaign = async (
  id: string,
  payload: Partial<PromotionCampaignPayload>
) => {
  const { restaurantId, branchId, ...body } = payload;

  const response = await api.patch(`/admin/promotions/campaigns/${id}`, body, {
    params: buildPromotionParams({
      restaurantId,
      branchId,
    }),
  });

  return response.data;
};

export const deleteAdminPromotionCampaign = async (
  id: string,
  params?: PromotionQueryParams
) => {
  const response = await api.delete(`/admin/promotions/campaigns/${id}`, {
    params: buildPromotionParams(params),
  });

  return response.data;
};
/**
 * Happy Hours
 */
export const getAdminHappyHours = async (params?: PromotionQueryParams) => {
  const response = await api.get("/admin/promotions/happy-hours", {
    params: buildPromotionParams(params),
  });

  return response.data;
};

export const getAdminHappyHourDetail = async (id: string) => {
  const response = await api.get(`/admin/promotions/happy-hours/${id}`);

  return response.data;
};

export const createAdminHappyHour = async (payload: HappyHourPayload) => {
  
  const response = await api.post("/admin/promotions/happy-hours", payload);

  return response.data;
};

export const updateAdminHappyHour = async (
  id: string,
  payload: Partial<HappyHourPayload>
) => {
 
  const response = await api.patch(`/admin/promotions/happy-hours/${id}`, payload);

  return response.data;
};

export const deleteAdminHappyHour = async (
  id: string,
  params?: PromotionQueryParams
) => {
  const response = await api.delete(`/admin/promotions/happy-hours/${id}`, {
    params: buildPromotionParams(params),
  });

  return response.data;
};
/**
 * Promotion Stats
 */
export const getAdminPromotionStats = async (id: string) => {
  const response = await api.get(`/admin/promotions/${id}/stats`);

  return response.data;
};
export type CouponPayload = {
  code: string;
  title: string;
  discountType: "FLAT" | "PERCENTAGE" | string;
  discountValue?: number;
  startsAt?: string;
  expiresAt?: string;
  description?: string;
  branchId?: string;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  scopeMenuItemId?: string;
  scopeCategoryId?: string;
  restaurantId?: string;
};

export type CouponStatus = "ACTIVE" | "SUSPENDED";

export type CouponStatusPayload = {
  restaurantId: string;
  status: CouponStatus;
};

export type CouponQueryParams = {
  restaurantId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export const getCoupons = async (params?: CouponQueryParams) => {
  const response = await api.get("/coupons", { params });
  return response.data;
};

export const createCoupon = async (payload: Partial<CouponPayload>) => {
  const response = await api.post("/coupons", payload);
  return response.data;
};

export const updateCoupon = async (id: string, payload: Partial<CouponPayload>) => {
  const body = { ...payload };
  delete body.restaurantId;

  const response = await api.patch(`/coupons/${id}`, body);
  return response.data;
};

export const updateCouponStatus = async (
  code: string,
  payload: CouponStatusPayload
) => {
  const response = await api.patch(`/coupons/${code}/status`, payload);
  return response.data;
};
