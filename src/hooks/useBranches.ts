import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  createBranchesBulk,
  getBranchDeliveryTime,
  getDeliveryHours,
  getOpeningHours,
  updateBranchDeliveryTime,
  updateDeliveryHours,
  updateOpeningHours,
  suspendBranch,
  activateBranch,
  updateBranchImages,
  forceDeleteBranch,
  TemporaryClosurePayload,
  updateBranchTemporaryClosure,
  getBranchHolidayOpeningHours,
  UpdateBranchHolidayOpeningHoursPayload,
  updateBranchHolidayOpeningHours,
} from "@/services/branches/branches.api";
import type { OpeningHoursValues } from "@/validations/branches";
import type {
  BranchDeliveryTimePayload,
  DeliveryHoursValues,
} from "@/services/branches/branches.api";
import { getApiErrorMessage } from "@/lib/errors";

type BranchUpdateData = Parameters<typeof updateBranch>[1];

/**
 * ==============================
 * BRANCH HOOKS
 * ==============================
 */

/**
 * Create Branch
 */
export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message051"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification026")));
    },
  });
};

/**
 * Get Branches List
 */
export const useGetBranches = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
  includeInactive?: boolean;
  restaurantId?: string;
  lat?: string;
  lng?: string;
}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [
      "branches",
      params?.page,
      params?.limit,
      params?.search,
      params?.sortOrder,
      params?.withDeleted,
      params?.includeInactive,
      params?.restaurantId,
      params?.lat,
      params?.lng,
    ],
    queryFn: () => getBranches(params),
    enabled: options?.enabled ?? true,
  });
};

/**
 * Get Single Branch
 */
export const useGetBranch = (id: string) => {
  return useQuery({
    queryKey: ["branches", id],
    queryFn: () => getBranch(id),
    enabled: !!id,
  });
};

/**
 * Update Branch
 */
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchUpdateData }) =>
      updateBranch(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({
        queryKey: ["branches", variables.id],
      });
      toast.success(getLocalizedMessage("message060"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification074")));
    },
  });
};

/**
 * Delete Branch (Soft)
 */
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message052"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification041")));
    },
  });
};

/**
 * Force Delete Branch
 */
export const useForceDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message058"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification063")));
    },
  });
};

/**
 * Bulk Create Branches
 */
export const useCreateBranchesBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBranchesBulk,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message062"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification027")));
    },
  });
};

/**
 * ==============================
 * OPENING HOURS
 * ==============================
 */

export const useGetOpeningHours = (branchId: string) => {
  return useQuery({
    queryKey: ["branch-opening-hours", branchId],
    queryFn: () => getOpeningHours(branchId),
    enabled: !!branchId,
  });
};

export const useUpdateOpeningHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string;
      data: OpeningHoursValues;
    }) => updateOpeningHours(branchId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branch-opening-hours", variables.branchId],
      });
      toast.success(getLocalizedMessage("message255"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification095")));
    },
  });
};

export const useGetDeliveryHours = (branchId: string) => {
  return useQuery({
    queryKey: ["branch-delivery-hours", branchId],
    queryFn: () => getDeliveryHours(branchId),
    enabled: !!branchId,
  });
};

export const useUpdateDeliveryHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string;
      data: DeliveryHoursValues;
    }) => updateDeliveryHours(branchId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branch-delivery-hours", variables.branchId],
      });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({
        queryKey: ["branches", variables.branchId],
      });
      toast.success(getLocalizedMessage("message101"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification078")));
    },
  });
};

export const useGetBranchDeliveryTime = (branchId?: string | null) => {
  return useQuery({
    queryKey: ["branch-delivery-time", branchId],
    queryFn: () => getBranchDeliveryTime(branchId as string),
    enabled: Boolean(branchId),
  });
};

export const useUpdateBranchDeliveryTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string;
      data: BranchDeliveryTimePayload;
    }) => updateBranchDeliveryTime(branchId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branch-delivery-time", variables.branchId],
      });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({
        queryKey: ["branches", variables.branchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["branches", "edit", variables.branchId],
      });
      toast.success(getLocalizedMessage("message053"));
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, getLocalizedMessage("notification076")),
      );
    },
  });
};

/**
 * ==============================
 * STATUS MANAGEMENT
 * ==============================
 */

export const useSuspendBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message059"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification071")));
    },
  });
};

export const useActivateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message048"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification011")));
    },
  });
};

/**
 * ==============================
 * IMAGES
 * ==============================
 */

export const useUpdateBranchImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data:
        | {
            logoUrl?: string;
            coverImage?: string;
          }
        | FormData;
    }) => updateBranchImages(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success(getLocalizedMessage("message055"));
    },

    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification082")));
    },
  });
};

export const useUpdateBranchTemporaryClosure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TemporaryClosurePayload;
    }) => updateBranchTemporaryClosure(id, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branch", variables.id] });

      toast.success(
        variables.payload.isClosed
          ? getLocalizedMessage("notification002")
          : getLocalizedMessage("notification003"),
      );
    },

    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, getLocalizedMessage("notification075")),
      );
    },
  });
};

export const useGetBranchHolidayOpeningHours = (branchId?: string) => {
  return useQuery({
    queryKey: ["branch-holiday-opening-hours", branchId],
    queryFn: () => getBranchHolidayOpeningHours(branchId as string),
    enabled: Boolean(branchId),
  });
};

export const useUpdateBranchHolidayOpeningHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: UpdateBranchHolidayOpeningHoursPayload;
    }) =>
      updateBranchHolidayOpeningHours({
        branchId,
        payload,
      }),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branch-holiday-opening-hours", variables.branchId],
      });

      queryClient.invalidateQueries({
        queryKey: ["branch", variables.branchId],
      });

      queryClient.invalidateQueries({
        queryKey: ["branches"],
      });

      toast.success(getLocalizedMessage("message145"));
    },

    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, getLocalizedMessage("notification081")),
      );
    },
  });
};

export const useGetBranchForEdit = (id?: string | null) => {
  return useQuery({
    queryKey: ["branches", "edit", id],
    queryFn: () => getBranch(id as string),
    enabled: Boolean(id),
  });
};

export const useUpdateBranchForEdit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchUpdateData }) =>
      updateBranch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branches", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["branches", "edit", variables.id],
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification074")));
    },
  });
};
