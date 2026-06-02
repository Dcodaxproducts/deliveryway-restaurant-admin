import api from "@/lib/axios";

export type RestaurantOption = {
  id: string;
  name?: string;
  slug?: string | null;
  domain?: string | null;
  tenantId?: string | null;
};

export const getRestaurants = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { data } = await api.get("/restaurants", { params });
  return data;
};
