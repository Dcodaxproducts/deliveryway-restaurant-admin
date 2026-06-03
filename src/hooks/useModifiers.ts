import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import {
  createModifier,
  deleteModifier,
  getModifiers,
  updateModifier,
} from "@/services/modifiers";
import type {
  ModifierCreatePayload,
  ModifierListParams,
  ModifierUpdatePayload,
} from "@/types/modifiers";

export const modifierKeys = {
  all: ["modifiers"] as const,
  list: (params?: ModifierListParams) =>
    [
      "modifiers",
      params?.restaurantId ?? "",
      params?.categoryId ?? "",
      params?.modifierGroupId ?? "",
      params?.search ?? "",
      params?.page ?? "",
      params?.limit ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
};

export const useModifiers = (params?: ModifierListParams) =>
  useQuery({
    queryKey: modifierKeys.list(params),
    queryFn: () => getModifiers(params),
    enabled: Boolean(params?.restaurantId),
  });

export const useCreateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModifierCreatePayload) => createModifier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifier-categories"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create modifier"));
    },
  });
};

export const useUpdateModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ModifierUpdatePayload;
    }) => updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifier-categories"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update modifier"));
    },
  });
};

export const useDeleteModifier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteModifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierKeys.all });
      queryClient.invalidateQueries({ queryKey: ["modifier-categories"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete modifier"));
    },
  });
};
