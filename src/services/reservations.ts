import api from "@/lib/axios";

export type GetAdminReservationsParams = {
  restaurantId: string;
  branchId?: string;
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateTableReservationPayload = {
  restaurantId?: string;
  branchId?: string;
  date?: string;
  time?: string;
  reservationDate?: string;
  guestCount: number;
  note?: string;
};

export const getAdminTableReservations = async (params: GetAdminReservationsParams) => {
  const { data } = await api.get("/customer-app/admin/table-reservations", { params });
  return data;
};

export const createTableReservation = async ({
  customerId,
  payload,
}: {
  customerId: string;
  payload: CreateTableReservationPayload;
}) => {
  const { data } = await api.post(`/customer-app/table-reservations?customerId=${customerId}`, payload);
  return data;
};
