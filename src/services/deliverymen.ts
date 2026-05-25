import api from "@/lib/axios";
import {
  DeliverymanValues,
  UpdateDeliverymanValues,
  DeliverymanStatusValues,
  AssignOrderValues,
} from "@/validations/deliverymen";

/**
 * ==============================
 * DELIVERYMEN APIS
 * ==============================
 */

/**
 * Create Deliveryman
 */
export const createDeliveryman = async (payload: DeliverymanValues) => {
  const { data } = await api.post("/deliverymen", payload);
  return data;
};

/**
 * Get Deliverymen List
 */
export const getDeliverymenList = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  status?: "AVAILABLE" | "OFFLINE" | "BUSY" | "INACTIVE";
}) => {
  const { data } = await api.get("/deliverymen", { params });
  return data;
};

/**
 * Get Single Deliveryman
 */
export const getDeliveryman = async (id: string) => {
  const { data } = await api.get(`/deliverymen/${id}`);
  return data.data;
};

/**
 * Update Deliveryman
 */
export const updateDeliveryman = async (
  id: string,
  payload: UpdateDeliverymanValues
) => {
  const { data } = await api.patch(`/deliverymen/${id}`, payload);
  return data;
};

/**
 * Delete Deliveryman
 */
export const deleteDeliveryman = async (id: string) => {
  const { data } = await api.delete(`/deliverymen/${id}`);
  return data.data;
};

/**
 * Update Deliveryman Status (ONLINE / OFFLINE)
 */
export const updateDeliverymanStatus = async (
  id: string,
  payload: DeliverymanStatusValues
) => {
  const { data } = await api.patch(
    `/deliverymen/${id}/status`,
    payload
  );
  return data;
};

/**
 * Assign Order to Deliveryman
 */
export const assignOrderToDeliveryman = async (
  id: string,
  payload: AssignOrderValues
) => {
  const { data } = await api.post(
    `/deliverymen/${id}/assign-order`,
    payload
  );
  return data;
};



