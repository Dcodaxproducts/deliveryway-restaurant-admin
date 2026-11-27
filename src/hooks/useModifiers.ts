import { getLocalizedMessage } from "@/lib/localized-message";
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
      toast.success(getLocalizedMessage("message220"));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification036")));
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
      toast.success(getLocalizedMessage("message231"));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification091")));
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
      toast.success(getLocalizedMessage("message221"));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification050")));
    },
  });
};
