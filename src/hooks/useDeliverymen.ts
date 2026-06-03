import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createDeliveryman,
  getDeliverymenList,
  getDeliveryman,
  updateDeliveryman,
  deleteDeliveryman,
  updateDeliverymanStatus,
  assignOrderToDeliveryman,
} from "@/services/deliverymen/deliverymen.api";
import { useRouter } from "next/navigation";

type DeliverymanMutationMessages = {
  success?: string;
  error?: string;
};

type DeliverymanMutationOptions = {
  messages?: DeliverymanMutationMessages;
};

/**
 * ==============================
 * GET DELIVERYMEN LIST
 * ==============================
 */
export const useDeliverymen = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  restaurantId?: string;
  branchId?: string;
  status?: "AVAILABLE" | "OFFLINE" | "BUSY" | "INACTIVE";
}) => {
  return useQuery({
    queryKey: ["deliverymen", params],
    queryFn: () => getDeliverymenList(params),
  });
};

/**
 * ==============================
 * GET SINGLE DELIVERYMAN
 * ==============================
 */
export const useDeliveryman = (id?: string) => {
  return useQuery({
    queryKey: ["deliveryman", id],
    queryFn: () => getDeliveryman(id!),
    enabled: !!id,
  });
};

/**
 * ==============================
 * ==============================
 */
export const useCreateDeliveryman = (options?: DeliverymanMutationOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createDeliveryman,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["deliverymen"] }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard", "deliverymen-stats"],
        }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success(
        options?.messages?.success || "Deliveryman created successfully!",
      );
      router.push("/deliveryman");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to create deliveryman",
      );
    },
  });
};

/**
 * ==============================
 * ==============================
 */
export const useUpdateDeliveryman = (options?: DeliverymanMutationOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateDeliveryman(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "deliverymen-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: ["deliveryman", variables.id],
      });
      toast.success(
        options?.messages?.success || "Deliveryman updated successfully!",
      );
      router.push("/deliveryman");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to update deliveryman",
      );
    },
  });
};

/**
 * ==============================
 * DELETE DELIVERYMAN
 * ==============================
 */
export const useDeleteDeliveryman = (options?: DeliverymanMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeliveryman,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "deliverymen-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        options?.messages?.success || "Deliveryman deleted successfully!",
      );
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to delete deliveryman",
      );
    },
  });
};

/**
 * ==============================
 * ==============================
 */
export const useUpdateDeliverymanStatus = (
  options?: DeliverymanMutationOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "AVAILABLE" | "OFFLINE" | "BUSY" | "INACTIVE";
    }) => updateDeliverymanStatus(id, { status }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "deliverymen-stats"],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        options?.messages?.success || "Status updated successfully!",
      );
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
 * ASSIGN ORDER
 * ==============================
 */
export const useAssignOrderToDeliveryman = (
  options?: DeliverymanMutationOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, orderId }: { id: string; orderId: string }) =>
      assignOrderToDeliveryman(id, { orderId }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      toast.success(
        options?.messages?.success || "Order assigned successfully!",
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          options?.messages?.error ||
          "Failed to assign order",
      );
    },
  });
};
