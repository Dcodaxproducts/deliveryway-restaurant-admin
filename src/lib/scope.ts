import { ADMIN_ROLES, type AuthUser } from "@/lib/auth";

export type CurrentScope = {
  tenantId?: string;
  restaurantId?: string;
  branchId?: string;
  branchName?: string;
  isBranchAdmin: boolean;
  isRestaurantAdmin: boolean;
};

export const getCurrentScope = (user?: AuthUser | null): CurrentScope => {
  const role = user?.role;
  const isBranchAdmin = role === ADMIN_ROLES.BRANCH_ADMIN;
  const isRestaurantAdmin = role === ADMIN_ROLES.RESTAURANT_ADMIN || role === ADMIN_ROLES.BUSINESS_ADMIN;

  return {
    tenantId: user?.tenantId ?? undefined,
    restaurantId: user?.restaurantId ?? undefined,
    branchId: user?.branchId ?? undefined,
    branchName: user?.branchName ?? undefined,
    isBranchAdmin,
    isRestaurantAdmin,
  };
};

export const applyRestaurantScope = <T extends Record<string, unknown>>(
  params: T,
  scope: CurrentScope
) => ({
  ...params,
  ...(scope.restaurantId ? { restaurantId: scope.restaurantId } : {}),
});

export const applyBranchScope = <T extends Record<string, unknown>>(
  params: T,
  scope: CurrentScope,
  options?: { includeRestaurant?: boolean }
) => ({
  ...params,
  ...(options?.includeRestaurant !== false && scope.restaurantId
    ? { restaurantId: scope.restaurantId }
    : {}),
  ...(scope.isBranchAdmin && scope.branchId ? { branchId: scope.branchId } : {}),
});

export const applyJwtOnlyScope = <T extends Record<string, unknown>>(params: T, scope: CurrentScope) => {
  if (!scope.isBranchAdmin) return applyRestaurantScope(params, scope);
  return params;
};
