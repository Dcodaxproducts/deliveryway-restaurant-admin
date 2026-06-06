import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import { modifierKeys } from "@/hooks/useModifiers";
import {
  attachModifierToGroup,
  createModifierGroup,
  deleteModifierGroup,
  detachModifierFromGroup,
  getModifierGroup,
  getModifierGroups,
  updateModifierGroup,
} from "@/services/modifier-groups";
import type {
  AttachModifierToGroupPayload,
  ModifierGroupCreatePayload,
  ModifierGroupListParams,
  ModifierGroupUpdatePayload,
} from "@/types/modifier-groups";

export const modifierGroupKeys = {
  all: ["modifier-groups"] as const,
  list: (params?: ModifierGroupListParams) =>
    [
      "modifier-groups",
      params?.restaurantId ?? "",
      params?.search ?? "",
      params?.page ?? "",
      params?.limit ?? "",
      params?.all ?? "",
      params?.inactive ?? "",
    ] as const,
  detail: (id?: string, restaurantId?: string) =>
    ["modifier-groups", "detail", id ?? "", restaurantId ?? ""] as const,
};

export const useModifierGroups = (params?: ModifierGroupListParams) =>
  useQuery({
    queryKey: modifierGroupKeys.list(params),
    queryFn: () => getModifierGroups(params),
    enabled: Boolean(params?.restaurantId),
  });

export const useModifierGroup = (
  id?: string,
  params?: Pick<ModifierGroupListParams, "restaurantId">
) =>
  useQuery({
    queryKey: modifierGroupKeys.detail(id, params?.restaurantId),
    queryFn: () => getModifierGroup(id as string, params),
    enabled: Boolean(id),
  });

export const useCreateModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModifierGroupCreatePayload) =>
      createModifierGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
      toast.success("Modifier group created successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create modifier group"));
    },
  });
};

export const useUpdateModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ModifierGroupUpdatePayload;
    }) => updateModifierGroup(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.detail(variables.id),
      });
      toast.success("Modifier group updated successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to update modifier group"));
    },
  });
};

export const useDeleteModifierGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteModifierGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
      toast.success("Modifier group deleted successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete modifier group"));
    },
  });
};

export const useAttachModifierToGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      modifierId,
      data,
    }: {
      groupId: string;
      modifierId: string;
      restaurantId?: string;
      data: AttachModifierToGroupPayload;
    }) => attachModifierToGroup(groupId, modifierId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
      queryClient.invalidateQueries({
        queryKey: [
          "modifier-groups",
          "detail",
          variables.groupId,
        ] as const,
      });
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.detail(
          variables.groupId,
          variables.restaurantId
        ),
      });
      toast.success("Modifier attached to group successfully!");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to attach modifier"));
    },
  });
};

export const useDetachModifierFromGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      modifierId,
    }: {
      groupId: string;
      modifierId: string;
      restaurantId?: string;
    }) => detachModifierFromGroup(groupId, modifierId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: modifierGroupKeys.all });
      queryClient.invalidateQueries({ queryKey: modifierKeys.all });
      queryClient.invalidateQueries({
        queryKey: [
          "modifier-groups",
          "detail",
          variables.groupId,
        ] as const,
      });
      queryClient.invalidateQueries({
        queryKey: modifierGroupKeys.detail(
          variables.groupId,
          variables.restaurantId
        ),
      });
      toast.success("Modifier detached from group");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to detach modifier"));
    },
  });
};
