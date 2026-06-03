import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStaff,
  getStaffList,
  getStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  createStaffRole,
  getStaffRoles,
  getStaffRole,
  updateStaffRole,
  deleteStaffRole,
} from "@/services/employees/employees.api";

type EmployeeMutationMessages = {
  success?: string;
  error?: string;
};

type EmployeeMutationOptions = {
  messages?: EmployeeMutationMessages;
};

/**
 * ==============================
 * STAFF HOOKS
 * ==============================
 */

export const useCreateStaff = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success(
        options?.messages?.success || "Staff created successfully!",
      );
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to create staff",
      );
    },
  });
};

export const useGetStaffList = (params?: {
  page?: number;
  search?: string;
  staffRoleId?: string;
  isActive?: boolean;
  restaurantId?: string;
  branchId?: string;
}) => {
  return useQuery({
    queryKey: [
      "staff",
      params?.page,
      params?.search,
      params?.staffRoleId,
      params?.isActive,
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getStaffList(params),
  });
};

export const useGetStaff = (id: string) => {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => getStaff(id),
    enabled: !!id,
  });
};

export const useUpdateStaff = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateStaff(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff", variables.id] });
      toast.success(
        options?.messages?.success || "Staff updated successfully!",
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to update staff",
      );
    },
  });
};

export const useDeleteStaff = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast.success(options?.messages?.success || "Staff deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to delete staff",
      );
    },
  });
};

/**
 * Toggle active/inactive
 */
export const useUpdateStaffStatus = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStaffStatus(id, isActive),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success(options?.messages?.success || "Staff status updated");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to update status",
      );
    },
  });
};

/**
 * ==============================
 * STAFF ROLE HOOKS
 * ==============================
 */

export const useCreateStaffRole = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success(options?.messages?.success || "Role created successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to create role",
      );
    },
  });
};

export const useGetStaffRoles = (params?: {
  page?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
}) => {
  return useQuery({
    queryKey: [
      "staff-roles",
      params?.page,
      params?.search,
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getStaffRoles(params),
  });
};

export const useGetStaffRole = (id: string) => {
  return useQuery({
    queryKey: ["staff-role", id],
    queryFn: () => getStaffRole(id),
    enabled: !!id,
  });
};

export const useUpdateStaffRole = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateStaffRole(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      queryClient.invalidateQueries({
        queryKey: ["staff-role", variables.id],
      });
      toast.success(options?.messages?.success || "Role updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to update role",
      );
    },
  });
};

export const useDeleteStaffRole = (options?: EmployeeMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaffRole,
    onSuccess: () => {
      toast.success(options?.messages?.success || "Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to delete role",
      );
    },
  });
};
