import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/errors";
import {
  assignModifierGroupToCategory,
  assignModifierGroupToItem,
  detachModifierGroupFromItem,
} from "@/services/modifier-group-assignments";
import type { AssignModifierGroupPayload } from "@/types/modifier-group-assignments";

export const useAssignModifierGroupToItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      groupId,
      data,
    }: {
      itemId: string;
      groupId: string;
      data: AssignModifierGroupPayload;
    }) => assignModifierGroupToItem(itemId, groupId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-item", variables.itemId],
      });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group assigned to item successfully!");
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to assign modifier group to item")
      );
    },
  });
};

export const useDetachModifierGroupFromItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      groupId,
    }: {
      itemId: string;
      groupId: string;
    }) => detachModifierGroupFromItem(itemId, groupId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-item", variables.itemId],
      });
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error, "Failed to detach modifier group from item")
      );
    },
  });
};

export const useAssignModifierGroupToCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      groupId,
      data,
    }: {
      categoryId: string;
      groupId: string;
      data: AssignModifierGroupPayload;
    }) => assignModifierGroupToCategory(categoryId, groupId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["menu-category", variables.categoryId],
      });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["modifier-groups"] });
      toast.success("Modifier group assigned to category successfully!");
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to assign modifier group to category"
        )
      );
    },
  });
};
