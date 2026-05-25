import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  BulkUpdateAllergenAdditiveTemplatesPayload,
  CreateAllergenAdditiveTemplateParams,
  DeleteAllergenAdditiveTemplateParams,
  GetAllergenAdditiveTemplatesParams,
  UpdateSingleAllergenAdditiveTemplateParams,
  createAllergenAdditiveTemplate,
  deleteAllergenAdditiveTemplate,
  getAllergenAdditiveTemplates,
  updateAllergenAdditiveTemplates,
  updateSingleAllergenAdditiveTemplate,
} from "@/services/menu/allergens/allergens.api";

/**
 * ==============================
 * QUERY KEYS
 * ==============================
 */

export const allergenAdditiveTemplateKeys = {
  all: ["allergen-additive-templates"] as const,

  list: (params?: GetAllergenAdditiveTemplatesParams) =>
    [
      "allergen-additive-templates",
      params?.restaurantId || "global",
    ] as const,
};

/**
 * ==============================
 * QUERY HOOKS
 * ==============================
 */

export const useGetAllergenAdditiveTemplates = (
  params?: GetAllergenAdditiveTemplatesParams
) => {
  return useQuery({
    queryKey: allergenAdditiveTemplateKeys.list(params),
    queryFn: () => getAllergenAdditiveTemplates(params),
  });
};

/**
 * ==============================
 * MUTATION HOOKS
 * ==============================
 */

export const useUpdateAllergenAdditiveTemplates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateAllergenAdditiveTemplatesPayload) =>
      updateAllergenAdditiveTemplates(payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.list({
          restaurantId: variables.restaurantId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: ["menu-items"],
      });

      toast.success("Allergen and additive templates updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update allergen and additive templates"
      );
    },
  });
};

export const useCreateAllergenAdditiveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateAllergenAdditiveTemplateParams) =>
      createAllergenAdditiveTemplate(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.list({
          restaurantId: variables.restaurantId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.all,
      });

      toast.success("Template added successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to add template"
      );
    },
  });
};

export const useUpdateSingleAllergenAdditiveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateSingleAllergenAdditiveTemplateParams) =>
      updateSingleAllergenAdditiveTemplate(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.list({
          restaurantId: variables.restaurantId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.all,
      });

      toast.success("Template updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update template"
      );
    },
  });
};

export const useDeleteAllergenAdditiveTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteAllergenAdditiveTemplateParams) =>
      deleteAllergenAdditiveTemplate(params),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.list({
          restaurantId: variables.restaurantId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: allergenAdditiveTemplateKeys.all,
      });

      toast.success("Template deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete template"
      );
    },
  });
};