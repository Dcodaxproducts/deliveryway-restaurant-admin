"use client";

import { useQuery } from "@tanstack/react-query";

import { getMenuItemTaxTypes } from "@/services/tax-types";

export const taxTypesQueryKeys = {
  menuItems: ["menu-items", "tax-types"] as const,
};

export const useMenuItemTaxTypes = (enabled = true) =>
  useQuery({
    queryKey: taxTypesQueryKeys.menuItems,
    queryFn: getMenuItemTaxTypes,
    enabled,
  });
