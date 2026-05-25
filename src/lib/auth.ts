export const ADMIN_ROLES = {
  BUSINESS_ADMIN: "BUSINESS_ADMIN",
  RESTAURANT_ADMIN: "RESTAURANT_ADMIN",
  BRANCH_ADMIN: "BRANCH_ADMIN",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES] | string;

export type AuthProfile = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: AdminRole;
  tenantId?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  profile: AuthProfile;
};

export type AuthStorage = {
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser | null;
  [key: string]: any;
};

const AUTH_STORAGE_KEY = "auth";

export const isBranchAdminRole = (role?: string | null) => {
  return role === ADMIN_ROLES.BRANCH_ADMIN;
};

export const isRestaurantAdminRole = (role?: string | null) => {
  return role === ADMIN_ROLES.BUSINESS_ADMIN || role === ADMIN_ROLES.RESTAURANT_ADMIN;
};

export const isAllowedAdminRole = (role?: string | null) => {
  return isBranchAdminRole(role) || isRestaurantAdminRole(role);
};

export const normalizeUser = (rawUser: any, fallback?: Partial<AuthUser> | null): AuthUser | null => {
  const source = rawUser || fallback;

  if (!source) return null;

  const tenantId =
    source.tenantId ??
    source.tid ??
    source.tenant?.id ??
    fallback?.tenantId ??
    (fallback as any)?.tid ??
    null;

  const restaurantId =
    source.restaurantId ??
    source.rid ??
    source.restaurant?.id ??
    fallback?.restaurantId ??
    (fallback as any)?.rid ??
    null;

  const branchId =
    source.branchId ??
    source.bid ??
    source.branch?.id ??
    fallback?.branchId ??
    (fallback as any)?.bid ??
    null;

  const branchName =
    source.branchName ??
    source.branch?.name ??
    fallback?.branchName ??
    null;

  return {
    ...fallback,
    ...source,
    id: String(source.id ?? fallback?.id ?? ""),
    email: source.email ?? fallback?.email ?? "",
    role: source.role ?? fallback?.role ?? "",
    tenantId,
    restaurantId,
    branchId,
    branchName,
    profile: {
      ...(fallback?.profile || {}),
      ...(source.profile || {}),
    },
  };
};

export const normalizeAuthPayload = (payload: any, fallback?: AuthStorage | null): AuthStorage => {
  const data = payload?.data ?? payload ?? {};
  const fallbackUser = fallback?.user ?? null;

  const accessToken = data.accessToken ?? data.token ?? fallback?.accessToken;
  const refreshToken = data.refreshToken ?? fallback?.refreshToken;
  const user = normalizeUser(data.user ?? data, fallbackUser);

  return {
    ...fallback,
    ...data,
    accessToken,
    refreshToken,
    user,
  };
};

export const getStoredAuth = (): AuthStorage | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveStoredAuth = (data: AuthStorage) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getDisplayName = (user?: AuthUser | null) => {
  const firstName = user?.profile?.firstName?.trim() || "";
  const lastName = user?.profile?.lastName?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) return fullName;
  if (user?.email) return user.email;
  return "Admin";
};

export const getInitials = (user?: AuthUser | null) => {
  const displayName = getDisplayName(user);
  const parts = displayName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return displayName.slice(0, 2).toUpperCase() || "AD";
};

export const getRoleLabel = (role?: string | null) => {
  if (role === ADMIN_ROLES.BRANCH_ADMIN) return "Branch Admin";
  if (role === ADMIN_ROLES.RESTAURANT_ADMIN) return "Restaurant Admin";
  if (role === ADMIN_ROLES.BUSINESS_ADMIN) return "Business Admin";
  return role || "Admin";
};

export const getScopedQueryParams = (user?: AuthUser | null) => {
  const params: Record<string, string> = {};

  if (user?.restaurantId) {
    params.restaurantId = user.restaurantId;
  }

  if (isBranchAdminRole(user?.role) && user?.branchId) {
    params.branchId = user.branchId;
  }

  return params;
};

export const canSwitchRestaurant = (user?: AuthUser | null) => {
  return Boolean(user && !isBranchAdminRole(user.role));
};
