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
  updatedAt?: string;
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
  [key: string]: unknown;
};

const AUTH_STORAGE_KEY = "auth";

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const getStringValue = (
  source: Record<string, unknown> | null | undefined,
  key: string
) => {
  const value = source?.[key];
  return typeof value === "string" ? value : undefined;
};

export const getRecordValue = (
  source: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown> | undefined => {
  const value = source?.[key];
  return isRecord(value) ? value : undefined;
};

const getBooleanValue = (
  source: Record<string, unknown> | null | undefined,
  key: string
) => {
  const value = source?.[key];
  return typeof value === "boolean" ? value : undefined;
};

const normalizeRoleName = (role?: string | null) => {
  return role?.trim().replace(/[\s-]+/g, "_").toUpperCase() || "";
};

const getRoleValue = (
  source: Record<string, unknown> | null | undefined,
  fallback?: Partial<AuthUser> | null
) => {
  const role = source?.role;

  if (typeof role === "string") {
    return normalizeRoleName(role);
  }

  if (isRecord(role)) {
    return normalizeRoleName(
      getStringValue(role, "name") ??
        getStringValue(role, "key") ??
        getStringValue(role, "code") ??
        getStringValue(role, "value")
    );
  }

  return normalizeRoleName(fallback?.role);
};

const getProfile = (
  source: Record<string, unknown>,
  fallback?: Partial<AuthUser> | null
): AuthProfile => {
  const profile = getRecordValue(source, "profile");

  return {
    ...(fallback?.profile ?? {}),
    ...(profile ?? {}),
    firstName: getStringValue(profile, "firstName") ?? fallback?.profile?.firstName,
    lastName: getStringValue(profile, "lastName") ?? fallback?.profile?.lastName,
    avatarUrl:
      getStringValue(profile, "avatarUrl") ?? fallback?.profile?.avatarUrl ?? null,
    phone: getStringValue(profile, "phone") ?? fallback?.profile?.phone ?? null,
    bio: getStringValue(profile, "bio") ?? fallback?.profile?.bio ?? null,
    createdAt: getStringValue(profile, "createdAt") ?? fallback?.profile?.createdAt,
    updatedAt: getStringValue(profile, "updatedAt") ?? fallback?.profile?.updatedAt,
  };
};

export const isBranchAdminRole = (role?: string | null) => {
  return normalizeRoleName(role) === ADMIN_ROLES.BRANCH_ADMIN;
};

export const isRestaurantAdminRole = (role?: string | null) => {
  const normalizedRole = normalizeRoleName(role);
  return (
    normalizedRole === ADMIN_ROLES.BUSINESS_ADMIN ||
    normalizedRole === ADMIN_ROLES.RESTAURANT_ADMIN
  );
};

export const isAllowedAdminRole = (role?: string | null) => {
  return isBranchAdminRole(role) || isRestaurantAdminRole(role);
};

export const normalizeUser = (
  rawUser: unknown,
  fallback?: Partial<AuthUser> | null
): AuthUser | null => {
  const rawRecord = isRecord(rawUser) ? rawUser : null;
  const fallbackRecord = fallback ? (fallback as Partial<AuthUser> & Record<string, unknown>) : null;
  const source = rawRecord ?? fallbackRecord;

  if (!source) return null;

  const tenant = getRecordValue(source, "tenant");
  const restaurant = getRecordValue(source, "restaurant");
  const branch = getRecordValue(source, "branch");

  const branchRestaurant = getRecordValue(branch, "restaurant");

  const tenantId =
    getStringValue(source, "tenantId") ??
    getStringValue(source, "tenant_id") ??
    getStringValue(source, "tid") ??
    getStringValue(tenant, "id") ??
    fallback?.tenantId ??
    null;

  const restaurantId =
    getStringValue(source, "restaurantId") ??
    getStringValue(source, "restaurant_id") ??
    getStringValue(source, "rid") ??
    getStringValue(restaurant, "id") ??
    getStringValue(branch, "restaurantId") ??
    getStringValue(branch, "restaurant_id") ??
    getStringValue(branchRestaurant, "id") ??
    fallback?.restaurantId ??
    null;

  const branchId =
    getStringValue(source, "branchId") ??
    getStringValue(source, "branch_id") ??
    getStringValue(source, "bid") ??
    getStringValue(branch, "id") ??
    fallback?.branchId ??
    null;

  const branchName =
    getStringValue(source, "branchName") ??
    getStringValue(branch, "name") ??
    fallback?.branchName ??
    null;

  return {
    ...fallback,
    ...(rawRecord ?? {}),
    id: String(source.id ?? fallback?.id ?? ""),
    email: getStringValue(source, "email") ?? fallback?.email ?? "",
    role: getRoleValue(source, fallback),
    tenantId,
    restaurantId,
    branchId,
    branchName,
    isVerified: getBooleanValue(source, "isVerified") ?? fallback?.isVerified,
    isActive: getBooleanValue(source, "isActive") ?? fallback?.isActive,
    profile: getProfile(source, fallback),
  };
};

export const normalizeAuthPayload = (
  payload: unknown,
  fallback?: AuthStorage | null
): AuthStorage => {
  const payloadRecord = isRecord(payload) ? payload : {};
  const envelopeData = getRecordValue(payloadRecord, "data");
  const data = envelopeData ?? payloadRecord;
  const fallbackUser = fallback?.user ?? null;

  const accessToken =
    getStringValue(data, "accessToken") ??
    getStringValue(data, "token") ??
    fallback?.accessToken;
  const refreshToken = getStringValue(data, "refreshToken") ?? fallback?.refreshToken;
  const userPayload = data.user ?? data;
  const user = normalizeUser(userPayload, fallbackUser);

  return {
    ...(fallback ?? {}),
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
    return stored ? normalizeAuthPayload(JSON.parse(stored)) : null;
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

export const getAvatarUrl = (user?: AuthUser | null) => {
  const avatarUrl = user?.profile?.avatarUrl?.trim();
  return avatarUrl || null;
};

export const getRoleLabel = (role?: string | null) => {
  const normalizedRole = normalizeRoleName(role);
  if (normalizedRole === ADMIN_ROLES.BRANCH_ADMIN) return "Branch Admin";
  if (normalizedRole === ADMIN_ROLES.RESTAURANT_ADMIN) return "Restaurant Admin";
  if (normalizedRole === ADMIN_ROLES.BUSINESS_ADMIN) return "Business Admin";
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
