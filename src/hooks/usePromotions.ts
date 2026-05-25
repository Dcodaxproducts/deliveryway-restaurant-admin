import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminHappyHour,
  createAdminPromotionCampaign,
  deleteAdminHappyHour,
  deleteAdminPromotionCampaign,
  getAdminHappyHourDetail,
  getAdminHappyHours,
  getAdminPromotionCampaignDetail,
  getAdminPromotionCampaigns,
  getAdminPromotionsOverview,
  getAdminPromotionStats,
  HappyHourPayload,
  PromotionCampaignPayload,
  PromotionQueryParams,
  updateAdminHappyHour,
  updateAdminPromotionCampaign,
} from "@/services/promotions/promotions.api";

export const promotionQueryKeys = {
  all: ["admin-promotions"] as const,

  overview: (params?: PromotionQueryParams) =>
    [
      "admin-promotions",
      "overview",
      params?.restaurantId,
      params?.branchId,
    ] as const,

  campaigns: (params?: PromotionQueryParams) =>
    [
      "admin-promotions",
      "campaigns",
      params?.restaurantId,
      params?.branchId,
      params?.search,
      params?.status,
      params?.type,
      params?.page,
      params?.limit,
    ] as const,
campaignDetail: (id?: string, params?: PromotionQueryParams) =>
  [
    "admin-promotions",
    "campaigns",
    "detail",
    id,
    params?.restaurantId,
    params?.branchId,
  ] as const,

  happyHours: (params?: PromotionQueryParams) =>
    [
      "admin-promotions",
      "happy-hours",
      params?.restaurantId,
      params?.branchId,
      params?.search,
      params?.status,
      params?.page,
      params?.limit,
    ] as const,

  happyHourDetail: (id?: string) =>
    ["admin-promotions", "happy-hours", "detail", id] as const,

  stats: (id?: string) => ["admin-promotions", "stats", id] as const,
};

/**
 * Overview
 */
export const useGetAdminPromotionsOverview = (
  params?: PromotionQueryParams
) => {
  return useQuery({
    queryKey: promotionQueryKeys.overview(params),
    queryFn: () => getAdminPromotionsOverview(params),
    enabled: Boolean(params?.restaurantId),
  });
};

/**
 * Campaigns
 */
export const useGetAdminPromotionCampaigns = (
  params?: PromotionQueryParams
) => {
  return useQuery({
    queryKey: promotionQueryKeys.campaigns(params),
    queryFn: () => getAdminPromotionCampaigns(params),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useGetAdminPromotionCampaignDetail = (
  id?: string,
  params?: PromotionQueryParams
) => {
  return useQuery({
    queryKey: promotionQueryKeys.campaignDetail(id, params),
    queryFn: () => getAdminPromotionCampaignDetail(id as string, params),
    enabled: Boolean(id && params?.restaurantId),
  });
};
export const useCreateAdminPromotionCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PromotionCampaignPayload) =>
      createAdminPromotionCampaign(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });
    },
  });
};

export const useUpdateAdminPromotionCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<PromotionCampaignPayload>;
    }) => updateAdminPromotionCampaign(id, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.campaignDetail(variables.id),
      });
    },
  });
};

export const useDeleteAdminPromotionCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      restaurantId,
      branchId,
    }: {
      id: string;
      restaurantId?: string | null;
      branchId?: string | null;
    }) =>
      deleteAdminPromotionCampaign(id, {
        restaurantId,
        branchId,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });
    },
  });
};

/**
 * Happy Hours
 */
export const useGetAdminHappyHours = (params?: PromotionQueryParams) => {
  return useQuery({
    queryKey: promotionQueryKeys.happyHours(params),
    queryFn: () => getAdminHappyHours(params),
    enabled: Boolean(params?.restaurantId),
  });
};

export const useGetAdminHappyHourDetail = (id?: string) => {
  return useQuery({
    queryKey: promotionQueryKeys.happyHourDetail(id),
    queryFn: () => getAdminHappyHourDetail(id as string),
    enabled: Boolean(id),
  });
};

export const useCreateAdminHappyHour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HappyHourPayload) => createAdminHappyHour(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });
    },
  });
};

export const useUpdateAdminHappyHour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<HappyHourPayload>;
    }) => updateAdminHappyHour(id, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.happyHourDetail(variables.id),
      });
    },
  });
};
export const useDeleteAdminHappyHour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      restaurantId,
      branchId,
    }: {
      id: string;
      restaurantId?: string | null;
      branchId?: string | null;
    }) =>
      deleteAdminHappyHour(id, {
        restaurantId,
        branchId,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionQueryKeys.all,
      });
    },
  });
};
/**
 * Promotion Stats
 */
export const useGetAdminPromotionStats = (id?: string) => {
  return useQuery({
    queryKey: promotionQueryKeys.stats(id),
    queryFn: () => getAdminPromotionStats(id as string),
    enabled: Boolean(id),
  });
};