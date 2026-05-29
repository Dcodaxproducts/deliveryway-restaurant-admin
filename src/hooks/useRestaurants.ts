import { useQuery } from "@tanstack/react-query";

import { getRestaurants } from "@/services/restaurants";

export const restaurantQueryKeys = {
  all: ["restaurants"] as const,
};

export const useGetRestaurants = (enabled = true) => {
  return useQuery({
    queryKey: restaurantQueryKeys.all,
    queryFn: getRestaurants,
    enabled,
  });
};
