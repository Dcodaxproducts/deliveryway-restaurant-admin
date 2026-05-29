import api from "@/lib/axios";

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

export interface Order {
  id: string;
  orderNumber?: string;
  orderType: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  branchId?: string | null;
  branch?: { id?: string; name?: string } | null;
  customer?: { fullName?: string; name?: string } | null;
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