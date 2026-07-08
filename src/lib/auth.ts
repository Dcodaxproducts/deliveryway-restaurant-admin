export const ADMIN_ROLES = {
  BUSINESS_ADMIN: "BUSINESS_ADMIN",
  RESTAURANT_ADMIN: "RESTAURANT_ADMIN",
  BRANCH_ADMIN: "BRANCH_ADMIN",
  STAFF: "STAFF",
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

export type StaffPermission = {
  id?: string;
  access?: string;
  operations?: string[];
};

export type RestaurantAccessScope = {
  restaurantIds?: string[];
  branchIds?: string[];
};

export type AuthStaffRole = {
  id?: string;
  name?: string;
  permissions?: StaffPermission[];
  restaurantAccess?: RestaurantAccessScope | null;
};

export type AuthUser = {
  id: string;
  email: string;
  role: AdminRole;
  tenantId?: string | null;
  restaurantId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  actorType?: "USER" | "STAFF" | "DELIVERYMAN" | string;
  restaurantAccess?: RestaurantAccessScope | null;
  staffRoleId?: string | null;
  staffRole?: AuthStaffRole | null;
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

const getStringArrayValue = (
  source: Record<string, unknown> | null | undefined,
  key: string
) => {
  const value = source?.[key];
  if (!Array.isArray(value)) return undefined;

  return value.filter((item): item is string => typeof item === "string");
};

const getRestaurantAccess = (
  source: Record<string, unknown> | null | undefined,
  fallback?: RestaurantAccessScope | null
): RestaurantAccessScope | null => {
  const restaurantIds = getStringArrayValue(source, "restaurantIds");
  const branchIds = getStringArrayValue(source, "branchIds");

  if (!restaurantIds && !branchIds) return fallback ?? null;

  return {
    restaurantIds: restaurantIds ?? fallback?.restaurantIds ?? [],
    branchIds: branchIds ?? fallback?.branchIds ?? [],
  };
};

const getStaffPermissions = (source: Record<string, unknown> | null | undefined) => {
  const permissions = source?.permissions;
  if (!Array.isArray(permissions)) return undefined;

  return permissions
    .filter(isRecord)
    .map((permission): StaffPermission => ({
      id: getStringValue(permission, "id"),
      access: getStringValue(permission, "access"),
      operations: getStringArrayValue(permission, "operations") ?? [],
    }));
};

const getStaffRole = (
  source: Record<string, unknown> | null | undefined,
  fallback?: AuthStaffRole | null
): AuthStaffRole | null => {
  const role = getRecordValue(source, "staffRole");
  if (!role && !fallback) return null;

  return {
    ...(fallback ?? {}),
    ...(role ?? {}),
    id: getStringValue(role, "id") ?? fallback?.id,
    name: getStringValue(role, "name") ?? fallback?.name,
    permissions: getStaffPermissions(role) ?? fallback?.permissions,
    restaurantAccess: getRestaurantAccess(
      getRecordValue(role, "restaurantAccess"),
      fallback?.restaurantAccess
    ),
  };
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

export const isStaffRole = (role?: string | null, actorType?: string | null) => {
  return (
    normalizeRoleName(actorType) === ADMIN_ROLES.STAFF ||
    normalizeRoleName(role) === ADMIN_ROLES.STAFF
  );
};

export const isRestaurantAdminRole = (role?: string | null) => {
  const normalizedRole = normalizeRoleName(role);
  return (
    normalizedRole === ADMIN_ROLES.BUSINESS_ADMIN ||
    normalizedRole === ADMIN_ROLES.RESTAURANT_ADMIN
  );
};

export const isAllowedAdminRole = (role?: string | null) => {
  return isBranchAdminRole(role) || isRestaurantAdminRole(role) || isStaffRole(role);
};

const STAFF_READ_OPERATIONS = new Set([
  "*",
  "read",
  "list",
  "view",
  "write",
  "create",
  "update",
  "delete",
  "manage",
  "reply",
  "assign",
  "resolve",
]);

const STAFF_ROUTE_ACCESS: Array<{ href: string; accesses: string[] }> = [
  { href: "/branches", accesses: ["branch_management", "branch-management"] },
  { href: "/branch-workspace", accesses: ["branch_management", "branch-management"] },
  { href: "/", accesses: ["dashboard"] },
  { href: "/orders", accesses: ["orders"] },
  { href: "/pos", accesses: ["pos"] },
  { href: "/menu/categories", accesses: ["menu-categories", "menu", "menu-management"] },
  { href: "/menu/cuisines", accesses: ["cuisines", "menu", "menu-management"] },
  { href: "/menu/modifier-categories", accesses: ["modifier-categories", "modifiers", "menu", "menu-management"] },
  { href: "/menu/modifier-groups", accesses: ["modifier-groups", "modifiers", "menu", "menu-management"] },
  { href: "/menu/modifier", accesses: ["modifiers", "menu", "menu-management"] },
  { href: "/menu/variations", accesses: ["variations", "menu", "menu-management"] },
  { href: "/menu/items", accesses: ["menu-items", "menu", "menu-management"] },
  { href: "/menu", accesses: ["menu", "menu-management", "restaurant-menus"] },
  { href: "/customer-settings", accesses: ["customers"] },
  { href: "/employees-settings", accesses: ["staff-management", "staff-roles"] },
  { href: "/promotion-management", accesses: ["promotions", "coupons"] },
  { href: "/reports", accesses: ["reports"] },
  { href: "/auto-printing", accesses: ["pos"] },
  { href: "/notifications", accesses: ["chat", "settings"] },
  { href: "/theme-settings", accesses: ["settings"] },
  { href: "/profile", accesses: ["settings"] },
];

const hasStaffAssignedScope = (user?: AuthUser | null) =>
  Boolean(
    user?.restaurantId ||
      user?.branchId ||
      user?.restaurantAccess?.restaurantIds?.length ||
      user?.restaurantAccess?.branchIds?.length ||
      user?.staffRole?.restaurantAccess?.restaurantIds?.length ||
      user?.staffRole?.restaurantAccess?.branchIds?.length
  );

export const hasStaffPermission = (
  user: AuthUser | null | undefined,
  accesses?: string[],
  operations: string[] = Array.from(STAFF_READ_OPERATIONS)
) => {
  if (!isStaffRole(user?.role, user?.actorType)) return false;
  if (!hasStaffAssignedScope(user)) return false;

  const permissions = user?.staffRole?.permissions;
  if (!Array.isArray(permissions)) return false;

  const allowedAccesses = accesses?.length
    ? new Set(accesses.map((access) => access.trim().toLowerCase()))
    : null;
  const allowedOperations = new Set(operations.map((operation) => operation.trim().toLowerCase()));

  return permissions.some((permission) => {
    const access = permission.access?.trim().toLowerCase();
    const permissionOperations = permission.operations?.map((operation) => operation.trim().toLowerCase());

    return Boolean(
      access &&
        (!allowedAccesses || access === "*" || allowedAccesses.has(access)) &&
        permissionOperations?.some((operation) => operation === "*" || allowedOperations.has(operation))
    );
  });
};

export const hasStaffPanelAccess = (user?: AuthUser | null) =>
  hasStaffPermission(user);

export const getStaffDefaultRedirectPath = (user?: AuthUser | null) => {
  if (!isStaffRole(user?.role, user?.actorType)) return "/";

  const route = STAFF_ROUTE_ACCESS.find((item) => hasStaffPermission(user, item.accesses));
  return route?.href || "/";
};

export const hasStaffMenuAccess = (user?: AuthUser | null) => {
  return hasStaffPermission(user, [
    "menu",
    "menus",
    "menu-management",
    "restaurant-menus",
    "menu-categories",
    "menu-items",
    "modifiers",
    "modifier-categories",
    "modifier-groups",
    "variations",
    "branch-overrides",
    "cuisines",
  ]);
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

  let restaurantId =
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

  const restaurantAccess = getRestaurantAccess(
    getRecordValue(source, "restaurantAccess"),
    fallback?.restaurantAccess
  );

  const staffRole = getStaffRole(source, fallback?.staffRole);
  const staffRestaurantIds = restaurantAccess?.restaurantIds?.length
    ? restaurantAccess.restaurantIds
    : staffRole?.restaurantAccess?.restaurantIds ?? [];

  if (!restaurantId && isStaffRole(getRoleValue(source, fallback), getStringValue(source, "actorType")) && staffRestaurantIds.length === 1) {
    restaurantId = staffRestaurantIds[0];
  }

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
    actorType: getStringValue(source, "actorType") ?? fallback?.actorType,
    restaurantAccess,
    staffRoleId: getStringValue(source, "staffRoleId") ?? fallback?.staffRoleId ?? null,
    staffRole,
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
  if (normalizedRole === ADMIN_ROLES.STAFF) return "Staff";
  return role || "Admin";
};

export const getScopedQueryParams = (user?: AuthUser | null) => {
  const params: Record<string, string> = {};

  if (user?.restaurantId) {
    params.restaurantId = user.restaurantId;
  }

  if ((isBranchAdminRole(user?.role) || isStaffRole(user?.role, user?.actorType)) && user?.branchId) {
    params.branchId = user.branchId;
  }

  return params;
};

export const canSwitchRestaurant = (user?: AuthUser | null) => {
  return Boolean(user && !isBranchAdminRole(user.role));
};
