import { getLocalizedMessage } from "@/lib/localized-message";
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
import type { CustomerListParams } from "@/validations/customers";
import { customerListQueryKey } from "@/lib/customer-list-query";

type CustomerMutationMessages = {
  success?: string;
  error?: string;
};

type CustomerMutationOptions = {
  messages?: CustomerMutationMessages;
};

/**
 * ==============================
 * CUSTOMER HOOKS
 * ==============================
 */

export const useCreateCustomer = (options?: CustomerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(
        options?.messages?.success || getLocalizedMessage("notification004"),
      );
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification028"),
      );
    },
  });
};

export const useGetCustomersList = (params?: CustomerListParams) => {
  return useQuery({
    queryKey: customerListQueryKey(params),
    queryFn: () => getCustomersList(params),
    enabled: Boolean(params?.restaurantId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
};

export const useGetCustomer = (id: string, restaurantId?: string) => {
  return useQuery({
    queryKey: ["customer", id, restaurantId],
    queryFn: () => getCustomer(id, restaurantId),
    enabled: !!id,
  });
};

export const useUpdateCustomer = (options?: CustomerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateCustomer(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      toast.success(
        options?.messages?.success || getLocalizedMessage("notification007"),
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification077"),
      );
    },
  });
};

export const useDeleteCustomer = (options?: CustomerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success(
        options?.messages?.success || getLocalizedMessage("notification005"),
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification042"),
      );
    },
  });
};

/**
 * Toggle customer active/inactive
 */
export const useUpdateCustomerStatus = (options?: CustomerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCustomerStatus(id, { isActive }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      toast.success(options?.messages?.success || getLocalizedMessage("notification006"));
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification099"),
      );
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
      toast.success(getLocalizedMessage("message089"));
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification064"),
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
      toast.success(getLocalizedMessage("message063"));
      queryClient.invalidateQueries({ queryKey: ["business-admins"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || getLocalizedMessage("notification016"),
      );
    },
  });
};

export const useVerifyCustomerEmail = (options?: CustomerMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, otp }: { token: string; otp: string }) =>
      verifyCustomerEmail({ token, otp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          getLocalizedMessage("notification144"),
      );
    },
  });
};
