"use client";

import { useAuth } from "@/hooks/useAuth";
import { getCurrentScope } from "@/lib/scope";

export const useCurrentScope = () => {
  const { user } = useAuth();
  return getCurrentScope(user);
};
