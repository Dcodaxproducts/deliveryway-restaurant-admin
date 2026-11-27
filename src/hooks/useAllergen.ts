import { getLocalizedMessage } from "@/lib/localized-message";
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
    ["allergen-additive-templates", params?.restaurantId || "global"] as const,
};

/**
 * ==============================
 * QUERY HOOKS
 * ==============================
 */

export const useGetAllergenAdditiveTemplates = (
  params?: GetAllergenAdditiveTemplatesParams,
) => {
  return useQuery({
    queryKey: allergenAdditiveTemplateKeys.list(params),
    queryFn: () => getAllergenAdditiveTemplates(params),
    enabled: Boolean(params?.restaurantId),
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

      toast.success(getLocalizedMessage("message033"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          getLocalizedMessage("notification073"),
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

      toast.success(getLocalizedMessage("message373"));
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || getLocalizedMessage("notification013"));
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

      toast.success(getLocalizedMessage("message375"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || getLocalizedMessage("notification100"),
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

      toast.success(getLocalizedMessage("message374"));
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || getLocalizedMessage("notification055"),
      );
    },
  });
};
