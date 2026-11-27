"use client";


import { getLocalizedMessage } from "@/lib/localized-message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getCustomerAppContent,
  getPublicAboutUs,
  getPublicPrivacyPolicy,
  updateCustomerAppAboutUs,
  updateCustomerAppPrivacyPolicy,
} from "@/services/customer-app-content";
import { getApiErrorMessage } from "@/lib/errors";

export const customerAppContentKeys = {
  content: (restaurantId?: string) =>
    ["customer-app-content", restaurantId || ""] as const,
  publicPrivacyPolicy: (restaurantId?: string) =>
    ["public-privacy-policy", restaurantId || ""] as const,
  publicAboutUs: (restaurantId?: string) =>
    ["public-about-us", restaurantId || ""] as const,
};

export const useCustomerAppContent = (restaurantId?: string) => {
  return useQuery({
    queryKey: customerAppContentKeys.content(restaurantId),
    queryFn: () => getCustomerAppContent(restaurantId as string),
    enabled: Boolean(restaurantId),
  });
};

export const usePublicPrivacyPolicy = (restaurantId?: string) => {
  return useQuery({
    queryKey: customerAppContentKeys.publicPrivacyPolicy(restaurantId),
    queryFn: () => getPublicPrivacyPolicy(restaurantId as string),
    enabled: Boolean(restaurantId),
  });
};

export const usePublicAboutUs = (restaurantId?: string) => {
  return useQuery({
    queryKey: customerAppContentKeys.publicAboutUs(restaurantId),
    queryFn: () => getPublicAboutUs(restaurantId as string),
    enabled: Boolean(restaurantId),
  });
};

export const useUpdateCustomerAppPrivacyPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      privacyPolicy,
    }: {
      restaurantId: string;
      privacyPolicy: string;
    }) => updateCustomerAppPrivacyPolicy(restaurantId, privacyPolicy),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        customerAppContentKeys.content(variables.restaurantId),
        data
      );
      queryClient.setQueryData(
        customerAppContentKeys.publicPrivacyPolicy(variables.restaurantId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: customerAppContentKeys.content(variables.restaurantId),
      });
      queryClient.invalidateQueries({
        queryKey: customerAppContentKeys.publicPrivacyPolicy(variables.restaurantId),
      });
      toast.success(getLocalizedMessage("message292"));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification096")));
    },
  });
};

export const useUpdateCustomerAppAboutUs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      restaurantId,
      aboutUs,
    }: {
      restaurantId: string;
      aboutUs: string;
    }) => updateCustomerAppAboutUs(restaurantId, aboutUs),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        customerAppContentKeys.content(variables.restaurantId),
        data
      );
      queryClient.setQueryData(
        customerAppContentKeys.publicAboutUs(variables.restaurantId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: customerAppContentKeys.content(variables.restaurantId),
      });
      queryClient.invalidateQueries({
        queryKey: customerAppContentKeys.publicAboutUs(variables.restaurantId),
      });
      toast.success(getLocalizedMessage("message011"));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, getLocalizedMessage("notification072")));
    },
  });
};
