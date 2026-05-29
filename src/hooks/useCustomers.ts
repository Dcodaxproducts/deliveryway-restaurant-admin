import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCustomer,
  getCustomersList,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  forceDeleteCustomers,
  approveBusinessAdmin,
  verifyCustomerEmail,
} from "@/services/customers/customers.api";

/**
 * ==============================
 * CUSTOMER HOOKS
 * ==============================
 */

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create customer");
    },
  });
};

export const useGetCustomersList = (params?: {
  page?: number;
  search?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
  includeInactive?: boolean;
  restaurantId?: string;
  branchId?: string;
}) => {
  return useQuery({
    queryKey: [
      "customers",
      params?.page,
      params?.search,
      params?.sortOrder,
      params?.withDeleted,
      params?.includeInactive,
      params?.restaurantId,
      params?.branchId,
    ],
    queryFn: () => getCustomersList(params),
  });
};

export const useGetCustomer = (id: string) => {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateCustomer(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      toast.success("Customer updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update customer");
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success("Customer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete customer");
    },
  });
};

/**
 * Toggle customer active/inactive
 */
export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => updateCustomerStatus(id, { isActive }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      toast.success("Customer status updated");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });
};

/**
 * Force delete customers by emails
 */
export const useForceDeleteCustomers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteCustomers,
    onSuccess: () => {
      toast.success("Customer(s) force deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to force delete customer(s)"
      );
    },
  });
};

/**
 * Approve pending business admin
 * Included because route was shared in the same module context
 */
export const useApproveBusinessAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveBusinessAdmin(id),
    onSuccess: () => {
      toast.success("Business admin approved successfully");
      queryClient.invalidateQueries({ queryKey: ["business-admins"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to approve business admin"
      );
    },
  });
};

export const useVerifyCustomerEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, otp }: { token: string; otp: string }) =>
      verifyCustomerEmail({ token, otp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Verification failed");
    },
  });
};
