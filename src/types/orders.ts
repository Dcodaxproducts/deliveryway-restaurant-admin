export type Order = {
  id: string;
  orderNumber?: string;
  orderType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  branchId?: string | null;
  branch?: { id?: string; name?: string } | null;
  customer?: { fullName?: string; name?: string } | null;
  isGroupOrder?: boolean;
};

export type OrderStatusUpdatePayload = {
  status: string;
  deliveryOtp?: string;
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
