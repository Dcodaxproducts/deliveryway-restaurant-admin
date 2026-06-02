import api, { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import type { Order, OrderStatusUpdatePayload } from "@/types/orders";

export interface GetOrdersParams {
  restaurantId: string;
  branchId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderType?: string;
  sortOrder?: string;
  kind?: string;
}

export interface OrdersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetOrdersResponse {
  success?: boolean;
  data: Order[];
  meta?: OrdersMeta | null;
  message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getString = (source: Record<string, unknown>, key: string, fallback = "") => {
  const value = source[key];
  return typeof value === "string" ? value : fallback;
};

const getOptionalString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" && value ? value : undefined;
};

const getNullableString = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getNumber = (source: Record<string, unknown>, key: string) => {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const normalizeOrderCustomer = (value: unknown): Order["customer"] => {
  if (!isRecord(value)) return null;

  return {
    fullName: getOptionalString(value, "fullName"),
    name: getOptionalString(value, "name"),
  };
};

const normalizeOrderBranch = (value: unknown): Order["branch"] => {
  if (!isRecord(value)) return null;

  return {
    id: getOptionalString(value, "id"),
    name: getOptionalString(value, "name"),
  };
};

export const normalizeOrder = (value: unknown): Order | null => {
  if (!isRecord(value)) return null;

  const id = getString(value, "id");
  if (!id) return null;

  return {
    id,
    orderNumber: getOptionalString(value, "orderNumber"),
    orderType: getString(value, "orderType"),
    status: getString(value, "status"),
    totalAmount: getNumber(value, "totalAmount"),
    createdAt: getString(value, "createdAt"),
    branchId: getNullableString(value, "branchId"),
    branch: normalizeOrderBranch(value.branch),
    customer: normalizeOrderCustomer(value.customer),
    isGroupOrder:
      typeof value.isGroupOrder === "boolean" ? value.isGroupOrder : undefined,
  };
};

const unwrapOrder = (payload: unknown): Order => {
  const source = isRecord(payload) && "data" in payload ? payload.data : payload;
  const order = normalizeOrder(source);

  if (!order) {
    throw new Error("Invalid order response");
  }

  return order;
};

export const getOrders = async (
  params: GetOrdersParams
): Promise<GetOrdersResponse> => {
  const { data } = await api.get("/orders", {
    params: {
      restaurantId: params.restaurantId,
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.page ? { page: params.page } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.orderType ? { orderType: params.orderType } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
      ...(params.kind ? { kind: params.kind } : {}),
    },
  });

  return {
    success: data?.success,
    data: data?.data || [],
    meta: data?.meta || null,
    message: data?.message,
  };
};

export const getOrderById = async (id: string) => {
  const { data } = await api.get(`/orders/${id}`);
  return data?.data;
};

export const updateOrderStatus = async (
  orderId: string,
  payload: OrderStatusUpdatePayload
): Promise<Order> => {
  const response = await httpClient.patch<unknown, Partial<OrderStatusUpdatePayload>>(
    `/orders/${orderId}/status`,
    cleanParams({
      status: payload.status,
      deliveryOtp: payload.deliveryOtp?.trim(),
    })
  );

  return unwrapOrder(response);
};
