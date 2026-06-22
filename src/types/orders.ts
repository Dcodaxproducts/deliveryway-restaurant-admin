export type DeliveryAddress = {
  address?: string | null;
  street?: string | null;
  shopNumber?: string | null;
  shopNo?: string | null;
  houseNumber?: string | null;
  area?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type Order = {
  id: string;
  orderNumber?: string;
  orderType: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  currency?: string | null;
  createdAt: string;
  orderTime?: string;
  isScheduled?: boolean;
  deliveryOtp?: string;
  deliverymanId?: string | null;
  branchId?: string | null;
  branch?: { id?: string; name?: string } | null;
  customer?: {
    id?: string;
    fullName?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  deliveryAddress?: DeliveryAddress | null;
  isGroupOrder?: boolean;
  transactions?: PaymentTransaction[] | null;
};

export type PaymentTransaction = {
  id?: string | null;
  paymentMethod?: string | null;
  type?: "CHARGE" | "REFUND" | string | null;
  status?: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | string | null;
  amount?: number | null;
  currency?: string | null;
  providerRef?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt?: string | null;
};

export type OrderStatusUpdatePayload = {
  status: string;
  deliveryOtp?: string;
  orderTime?: string;
};

export type OrderStatusOption = {
  value: string;
  label: string;
};

export const ORDER_STATUS_OPTIONS: OrderStatusOption[] = [
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "READY_TO_SERVE", label: "Ready to Serve" },
  { value: "SERVED", label: "Served" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];
