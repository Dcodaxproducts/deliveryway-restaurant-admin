import api from "@/lib/axios";
import { StaffRoleValues, StaffValues } from "@/validations/employees";


/**
 * ==============================
 * STAFF APIS
 * ==============================
 */

export const createStaff = async (payload: StaffValues) => {
  const { data } = await api.post("/staff-management", payload);
  return data;
};

export const getStaffList = async (params?: {
  page?: number;
  search?: string;
  staffRoleId?: string;
  isActive?: boolean;
  restaurantId?: string;
  branchId?: string;
}) => {
  const { data } = await api.get("/staff-management", { params });
  return data;
};

export const getStaff = async (id: string) => {
  const { data } = await api.get(`/staff-management/${id}`);
  return data.data;
};

export const updateStaff = async (id: string, payload: Partial<StaffValues>) => {
  const { data } = await api.patch(`/staff-management/${id}`, payload);
  return data;
};

export const deleteStaff = async (id: string) => {
  const { data } = await api.delete(`/staff-management/${id}`);
  return data.data;
};

/**
 * Toggle staff active/inactive
 */
export const updateStaffStatus = async (
  id: string,
  isActive: boolean
) => {
  const { data } = await api.patch(
    `/staff-management/${id}/status`,
    { isActive }
  );
  return data;
};

/**
 * ==============================
 * STAFF ROLE APIS
 * ==============================
 */

export const createStaffRole = async (payload: StaffRoleValues) => {
  const { data } = await api.post("/staff-roles", payload);
  return data;
};

export const getStaffRoles = async (params?: {
  page?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
}) => {
  const { data } = await api.get("/staff-roles", { params });
  return data;
};

export const getStaffRole = async (id: string) => {
  const { data } = await api.get(`/staff-roles/${id}`);
  return data.data;
};

export const updateStaffRole = async (
  id: string,
  payload: Partial<StaffRoleValues>
) => {
  const { data } = await api.patch(`/staff-roles/${id}`, payload);
  return data;
};

export const deleteStaffRole = async (id: string) => {
  const { data } = await api.delete(`/staff-roles/${id}`);
  return data.data;
};