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
 * CREATE DELIVERYMAN
 * ==============================
 */
export const useCreateDeliveryman = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createDeliveryman,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["deliverymen"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "deliverymen-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Deliveryman created successfully!");
      router.push("/deliveryman");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create deliveryman"
      );
    },
  });
};

/**
 * ==============================
 * UPDATE DELIVERYMAN
 * ==============================
 */
export const useUpdateDeliveryman = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateDeliveryman(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "deliverymen-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({
        queryKey: ["deliveryman", variables.id],
      });
      toast.success("Deliveryman updated successfully!");
      router.push("/deliveryman");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update deliveryman"
      );
    },
  });
};

/**
 * ==============================
 * DELETE DELIVERYMAN
 * ==============================
 */
export const useDeleteDeliveryman = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeliveryman,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "deliverymen-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Deliveryman deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to delete deliveryman"
      );
    },
  });
};

/**
 * ==============================
 * UPDATE STATUS
 * ==============================
 */
export const useUpdateDeliverymanStatus = () => {
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
      queryClient.invalidateQueries({ queryKey: ["dashboard", "deliverymen-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Status updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update status"
      );
    },
  });
};

/**
 * ==============================
 * ASSIGN ORDER
 * ==============================
 */
export const useAssignOrderToDeliveryman = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      orderId,
    }: {
      id: string;
      orderId: string;
    }) =>
      assignOrderToDeliveryman(id, { orderId }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverymen"] });
      toast.success("Order assigned successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to assign order"
      );
    },
  });
};