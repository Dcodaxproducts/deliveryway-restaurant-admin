import api from "@/lib/axios";

export type RestaurantOption = {
  id: string;
  name?: string;
  tenantId?: string | null;
};

export const getRestaurants = async () => {
  const { data } = await api.get("/restaurants");
  return data;
};
