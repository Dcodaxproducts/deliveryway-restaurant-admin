"use client";

import { useQuery } from "@tanstack/react-query";

import { getTaxTypes } from "@/services/tax-types";

export const taxTypesQueryKeys = {
  global: ["tax-types", "global"] as const,
};

export const useTaxTypes = (enabled = true) =>
  useQuery({
    queryKey: taxTypesQueryKeys.global,
    queryFn: getTaxTypes,
    enabled,
  });
