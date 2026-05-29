import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkoutCart,
  clearCart,
  deleteCartItem,
  getCart,
  getCustomerAddresses,
  setCartAddress,
  setCartOrderType,
  updateCartItemQuantity,
} from "@/services/pos";

export const posQueryKeys = {
  cart: (customerId?: string | null) => ["pos", "cart", customerId] as const,
  addresses: (customerId?: string | null) => ["pos", "addresses", customerId] as const,
};

export const useGetCart = (customerId?: string | null) => {
  return useQuery({
    queryKey: posQueryKeys.cart(customerId),
    queryFn: () => getCart(customerId as string),
    enabled: Boolean(customerId),
  });
};

export const useGetCustomerAddresses = (customerId?: string | null) => {
  return useQuery({
    queryKey: posQueryKeys.addresses(customerId),
    queryFn: () => getCustomerAddresses(customerId as string),
    enabled: Boolean(customerId),
  });
};

export const useUpdateCartItemQuantity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartItemQuantity,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(variables.customerId) });
    },
  });
};

export const useDeleteCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCartItem,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(variables.customerId) });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(customerId) });
      queryClient.invalidateQueries({ queryKey: posQueryKeys.addresses(customerId) });
    },
  });
};

export const useSetCartOrderType = () => useMutation({ mutationFn: setCartOrderType });
export const useSetCartAddress = () => useMutation({ mutationFn: setCartAddress });
export const useCheckoutCart = () => useMutation({ mutationFn: checkoutCart });
