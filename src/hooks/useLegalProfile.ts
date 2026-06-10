"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getLegalProfile,
  updateLegalProfile,
  type LegalProfilePayload,
} from "@/services/legal-profile";
import { getApiErrorMessage } from "@/lib/errors";

export const legalProfileQueryKeys = {
  detail: (restaurantId?: string) =>
    ["legal-profile", restaurantId || ""] as const,
};

export const useLegalProfile = (restaurantId?: string) =>
  useQuery({
    queryKey: legalProfileQueryKeys.detail(restaurantId),
    queryFn: () => getLegalProfile(restaurantId as string),
    enabled: Boolean(restaurantId),
  });

export const useUpdateLegalProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      payload,
    }: {
      restaurantId: string;
      payload: LegalProfilePayload;
    }) => updateLegalProfile(restaurantId, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        legalProfileQueryKeys.detail(variables.restaurantId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: legalProfileQueryKeys.detail(variables.restaurantId),
      });
      toast.success("Legal profile updated successfully.");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update legal profile"));
    },
  });
};
