"use client";

import { useQuery } from "@tanstack/react-query";

import { getPaymentMethods } from "@/services/payment-methods";

export const paymentMethodsQueryKeys = {
  global: ["payment-methods", "global"] as const,
};

export const usePaymentMethods = (enabled = true) =>
  useQuery({
    queryKey: paymentMethodsQueryKeys.global,
    queryFn: getPaymentMethods,
    enabled,
  });
