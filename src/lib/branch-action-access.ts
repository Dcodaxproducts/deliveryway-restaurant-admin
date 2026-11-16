const normalizeRole = (role?: string | null) => role?.trim().toUpperCase();

export const canDeleteOrSuspendBranch = (role?: string | null) =>
  normalizeRole(role) === "SUPER_ADMIN";

export const canActivateBranch = (role?: string | null) =>
  ["SUPER_ADMIN", "BUSINESS_ADMIN", "RESTAURANT_ADMIN"].includes(
    normalizeRole(role) ?? "",
  );
