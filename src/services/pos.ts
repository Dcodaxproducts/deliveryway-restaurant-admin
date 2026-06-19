import api from "@/lib/axios";
import type {
  PosCartSettingsPayload,
  PosCheckoutPayload,
  PosOrderType,
} from "@/components/pages/Pos/components/pos/pos-checkout-payload";

export const getCart = async (customerId: string) => {
  const { data } = await api.get("/cart", { params: { customerId } });
  return data;
};

export const getCustomerAddresses = async (customerId: string) => {
  const { data } = await api.get("/addresses", { params: { customerId } });
  return data;
};

export const updateCartItemQuantity = async ({
  customerId,
  itemId,
  quantity,
}: {
  customerId: string;
  itemId: string;
  quantity: number;
}) => {
  const { data } = await api.patch(`/cart/items/${itemId}?customerId=${customerId}`, { quantity });
  return data;
};

export const updateCartDealQuantity = async ({
  customerId,
  dealId,
  quantity,
}: {
  customerId: string;
  dealId: string;
  quantity: number;
}) => {
  const { data } = await api.patch(`/cart/deals/${dealId}?customerId=${customerId}`, { quantity });
  return data;
};

export const deleteCartItem = async ({ customerId, itemId }: { customerId: string; itemId: string }) => {
  const { data } = await api.delete(`/cart/items/${itemId}?customerId=${customerId}`);
  return data;
};

export const deleteCartDeal = async ({ customerId, dealId }: { customerId: string; dealId: string }) => {
  const { data } = await api.delete(`/cart/deals/${dealId}?customerId=${customerId}`);
  return data;
};

export const clearCart = async (customerId: string) => {
  const { data } = await api.delete(`/cart?customerId=${customerId}`);
  return data;
};

export const setCartOrderType = async ({
  customerId,
  orderType,
}: {
  customerId: string;
  orderType: PosOrderType;
}) => {
  const { data } = await api.patch(`/cart/order-type?customerId=${customerId}`, { orderType });
  return data;
};

export const updateCartSettings = async ({
  customerId,
  payload,
}: {
  customerId: string;
  payload: PosCartSettingsPayload;
}) => {
  const { data } = await api.patch(`/cart?customerId=${customerId}`, payload);
  return data;
};

export const setCartAddress = async ({
  customerId,
  deliveryAddressId,
}: {
  customerId: string;
  deliveryAddressId: string;
}) => {
  const { data } = await api.patch(`/cart/address?customerId=${customerId}`, { deliveryAddressId });
  return data;
};

export const applyCartCoupon = async ({
  customerId,
  couponCode,
}: {
  customerId: string;
  couponCode: string;
}) => {
  const { data } = await api.patch(`/cart/coupon?customerId=${customerId}`, {
    couponCode,
  });
  return data;
};

export const removeCartCoupon = async (customerId: string) => {
  const { data } = await api.delete(`/cart/coupon?customerId=${customerId}`);
  return data;
};

export const quoteCart = async (customerId: string) => {
  const { data } = await api.post(`/cart/quote?customerId=${customerId}`, {});
  return data;
};

export const checkoutCart = async ({
  customerId,
  payload,
}: {
  customerId: string;
  payload: PosCheckoutPayload;
}) => {
  const { data } = await api.post(`/cart/checkout?customerId=${customerId}`, payload);
  return data;
};
