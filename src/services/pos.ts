import api from "@/lib/axios";

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

export const deleteCartItem = async ({ customerId, itemId }: { customerId: string; itemId: string }) => {
  const { data } = await api.delete(`/cart/items/${itemId}?customerId=${customerId}`);
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
  orderType: "TAKEAWAY" | "DELIVERY";
}) => {
  const { data } = await api.patch(`/cart/order-type?customerId=${customerId}`, { orderType });
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

export const checkoutCart = async ({
  customerId,
  payload,
}: {
  customerId: string;
  payload: {
    orderTime: string;
    paymentMethod: string;
    branchId?: string;
  };
}) => {
  const { data } = await api.post(`/cart/checkout?customerId=${customerId}`, payload);
  return data;
};
