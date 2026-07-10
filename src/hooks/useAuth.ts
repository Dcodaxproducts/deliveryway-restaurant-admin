"use client";

import { useAuthContext } from "@/components/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getScopedQueryParams,
  getStaffDefaultRedirectPath,
  isBranchAdminRole,
  isRestaurantAdminRole,
  isStaffRole,
  isStaffRouteAllowed,
} from "@/lib/auth";
import { buildLoginRoute } from "@/lib/auth-routes";
import { isPublicRoute as isPublicAccessRoute } from "@/lib/access";

export const useAuth = () => {
  const { user, token, loading, setUser, logout } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = isPublicAccessRoute(pathname);

  useEffect(() => {
    if (loading || isPublicRoute) return;

    if (!user) {
      router.push(buildLoginRoute(pathname));
      return;
    }

    if (
      isStaffRole(user.role, user.actorType) &&
      !isStaffRouteAllowed(user, pathname)
    ) {
      router.replace(getStaffDefaultRedirectPath(user));
    }
  }, [loading, user, pathname, isPublicRoute, router]);

  const role = user?.role;
  const isBranchAdmin = isBranchAdminRole(role);
  const isRestaurantAdmin = isRestaurantAdminRole(role);
  const restaurantId = user?.restaurantId ?? undefined;
  const branchId = user?.branchId ?? undefined;
  const tenantId = user?.tenantId ?? undefined;
  const scopedParams = getScopedQueryParams(user);

  return {
    user,
    token,
    tenantId,
    restaurantId,
    branchId,
    role,
    isBranchAdmin,
    isRestaurantAdmin,
    scopedParams,
    loading,
    setUser,
    logout,
  };
};
