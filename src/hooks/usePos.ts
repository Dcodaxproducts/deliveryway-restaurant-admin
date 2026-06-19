import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyCartCoupon,
  checkoutCart,
  clearCart,
  deleteCartDeal,
  deleteCartItem,
  getCart,
  getCustomerAddresses,
  quoteCart,
  removeCartCoupon,
  setCartAddress,
  setCartOrderType,
  updateCartSettings,
  updateCartDealQuantity,
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

export const useUpdateCartDealQuantity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartDealQuantity,
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

export const useDeleteCartDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCartDeal,
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
export const useUpdateCartSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCartSettings,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(variables.customerId) });
    },
  });
};
export const useApplyCartCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyCartCoupon,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(variables.customerId) });
    },
  });
};
export const useRemoveCartCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCartCoupon,
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({ queryKey: posQueryKeys.cart(customerId) });
    },
  });
};
export const useQuoteCart = () => useMutation({ mutationFn: quoteCart });
export const useCheckoutCart = () => useMutation({ mutationFn: checkoutCart });
