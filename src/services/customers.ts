import api from "@/lib/axios";
import {
  CreateCustomerValues,
  UpdateCustomerValues,
  CustomerStatusValues,
  ForceDeleteCustomerValues,
  CustomerListParams,
} from "@/validations/customers";

/**
 * ==============================
 * CUSTOMER APIS
 * ==============================
 */

/**
 * Create customer
 * Uses public auth flow because your current modal uses:
 * POST /v1/auth/register-customer
 */
export const createCustomer = async (payload: CreateCustomerValues) => {
  const { data } = await api.post("/auth/register-customer", payload);
  return data;
};

/**
 * Get all customers for admin/staff management
 * Supports:
 * search, sortOrder, withDeleted, includeInactive, restaurantId
 */
export const getCustomersList = async (params?: CustomerListParams) => {
  const { data } = await api.get("/admin/users/customers", { params });
  return data;
};

/**
 * Get single customer details
 */
export const getCustomer = async (id: string) => {
  const { data } = await api.get(`/admin/users/customers/${id}`);
  return data.data ?? data;
};

/**
 * Update customer details
 */
export const updateCustomer = async (
  id: string,
  payload: UpdateCustomerValues
) => {
  const { data } = await api.patch(`/admin/users/customers/${id}`, payload);
  return data;
};

/**
 * Block / Unblock customer
 */
export const updateCustomerStatus = async (
  id: string,
  payload: CustomerStatusValues
) => {
  const { data } = await api.patch(
    `/admin/users/customers/${id}/status`,
    payload
  );
  return data;
};

/**
 * Soft delete customer / lower-scope user
 * Route shared at /admin/users/{id}
 */
export const deleteCustomer = async (id: string) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data.data ?? data;
};

/**
 * Force delete user(s) by email
 */
export const forceDeleteCustomers = async (
  payload: ForceDeleteCustomerValues
) => {
  const { data } = await api.post("/admin/users/force-delete", payload);
  return data;
};

/**
 * Approve pending business admin
 * Keeping here only because you included the route in same module context.
 * If you want cleaner separation, move this into business-admin services.
 */
export const approveBusinessAdmin = async (id: string) => {
  const { data } = await api.patch(
    `/admin/users/business-admins/${id}/approve`
  );
  return data;
};