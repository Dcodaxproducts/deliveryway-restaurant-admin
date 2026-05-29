import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  createBranchesBulk,
  getOpeningHours,
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
import { useRouter } from "next/navigation";

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
      toast.success("Branch created successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create branch");
    },
  });
};

/**
 * Get Branches List
 */
export const useGetBranches = (params?: {
  search?: string;
  sortOrder?: "ASC" | "DESC";
  withDeleted?: boolean;
  includeInactive?: boolean;
  restaurantId?: string;
  lat?: string;
  lng?: string;
}) => {
  return useQuery({
    queryKey: [
      "branches",
      params?.search,
      params?.sortOrder,
      params?.withDeleted,
      params?.includeInactive,
      params?.restaurantId,
      params?.lat,
      params?.lng,
    ],
    queryFn: () => getBranches(params),
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
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateBranch(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({
        queryKey: ["branches", variables.id],
      });
      toast.success("Branch updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update branch");
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
      toast.success("Branch deleted successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete branch");
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
      toast.success("Branch permanently deleted!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to force delete branch"
      );
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
      toast.success("Branches created successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create branches"
      );
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
      data: any;
    }) => updateOpeningHours(branchId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["branch-opening-hours", variables.branchId],
      });
      toast.success("Opening hours updated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update opening hours"
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
      toast.success("Branch suspended successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to suspend branch"
      );
    },
  });
};

export const useActivateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateBranch,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch activated successfully!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to activate branch"
      );
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
      toast.success("Branch images updated!");
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update images"
      );
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
          ? "Branch closed temporarily!"
          : "Branch reopened successfully!"
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update branch closure status"
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

      toast.success("Holiday opening hours updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update holiday opening hours"
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
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBranch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branches", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["branches", "edit", variables.id] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update branch");
    },
  });
};
