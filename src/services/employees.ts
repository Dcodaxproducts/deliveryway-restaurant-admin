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
  limit?: number;
  search?: string;
  staffRoleId?: string;
  isActive?: boolean;
  restaurantId?: string;
  branchId?: string;
}) => {
  const safeParams = { ...(params || {}) };
  delete safeParams.restaurantId;
  delete safeParams.branchId;
  const { data } = await api.get("/staff-management", { params: safeParams });
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


export type PermissionModule = {
  id?: string;
  name: string;
  description?: string | null;
  accessKey: string;
  defaultActions: string[];
  sortOrder?: number | null;
  isActive?: boolean;
};

const unwrapData = <T>(response: unknown): T => {
  const record = response as { data?: unknown };
  return (Array.isArray(record?.data) ? record.data : response) as T;
};

export const getPermissionModules = async (params?: {
  isActive?: boolean;
  limit?: number;
}) => {
  const { data } = await api.get("/permission-modules", {
    params: { isActive: true, limit: 100, ...params },
  });
  return unwrapData<PermissionModule[]>(data);
};

/**
 * ==============================
 * STAFF ROLE APIS
 * ==============================
 */

const toStaffRolePayload = (payload: StaffRoleValues | Partial<StaffRoleValues>) => {
  const body = { ...payload };
  delete body.restaurantId;
  delete body.branchId;
  return body;
};

export const createStaffRole = async (payload: StaffRoleValues) => {
  const { data } = await api.post("/staff-roles", toStaffRolePayload(payload));
  return data;
};

export const getStaffRoles = async (params?: {
  page?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
}) => {
  const safeParams = { ...(params || {}) };
  delete safeParams.restaurantId;
  delete safeParams.branchId;
  const { data } = await api.get("/staff-roles", { params: safeParams });
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
  const { data } = await api.patch(`/staff-roles/${id}`, toStaffRolePayload(payload));
  return data;
};

export const deleteStaffRole = async (id: string) => {
  const { data } = await api.delete(`/staff-roles/${id}`);
  return data.data;
};
