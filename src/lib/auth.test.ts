import { describe, expect, it } from "vitest";

import {
  getStaffDefaultRedirectPath,
  hasStaffMenuAccess,
  hasStaffPanelAccess,
  hasStaffPermission,
  isBranchAdminRole,
  normalizeUser,
} from "@/lib/auth";

describe("auth helpers", () => {
  it("normalizes restaurant id from a branch admin branch relationship", () => {
    const user = normalizeUser({
      id: "branch-admin-1",
      email: "branch@example.com",
      role: "BRANCH_ADMIN",
      branch: {
        id: "branch-1",
        name: "Downtown",
        restaurantId: "restaurant-1",
      },
      profile: {
        firstName: "Branch",
      },
    });

    expect(user?.restaurantId).toBe("restaurant-1");
    expect(user?.branchId).toBe("branch-1");
    expect(user?.branchName).toBe("Downtown");
  });

  it("normalizes restaurant id from nested branch restaurant details", () => {
    const user = normalizeUser({
      id: "branch-admin-2",
      email: "nested@example.com",
      role: "BRANCH_ADMIN",
      branch_id: "branch-2",
      branch: {
        restaurant: {
          id: "restaurant-2",
        },
      },
    });

    expect(user?.restaurantId).toBe("restaurant-2");
    expect(user?.branchId).toBe("branch-2");
  });

  it("normalizes branch admin role casing from auth payloads", () => {
    const user = normalizeUser({
      id: "branch-admin-3",
      email: "role@example.com",
      role: "branch-admin",
    });

    expect(user?.role).toBe("BRANCH_ADMIN");
    expect(isBranchAdminRole(user?.role)).toBe(true);
  });

  it("normalizes branch admin role from nested role objects", () => {
    const user = normalizeUser({
      id: "branch-admin-4",
      email: "role-object@example.com",
      role: {
        name: "branch admin",
      },
    });

    expect(user?.role).toBe("BRANCH_ADMIN");
    expect(isBranchAdminRole(user?.role)).toBe(true);
  });

  it("normalizes staff menu access claims from auth payloads", () => {
    const user = normalizeUser({
      id: "staff-1",
      email: "staff@example.com",
      role: "STAFF",
      actorType: "STAFF",
      restaurantAccess: { restaurantIds: ["restaurant-1"], branchIds: ["branch-1"] },
      staffRoleId: "role-1",
      staffRole: {
        id: "role-1",
        permissions: [{ access: "menu-items", operations: ["read"] }],
      },
    });

    expect(user?.actorType).toBe("STAFF");
    expect(user?.restaurantAccess?.restaurantIds).toEqual(["restaurant-1"]);
    expect(user?.staffRole?.permissions?.[0]?.access).toBe("menu-items");
    expect(hasStaffMenuAccess(user)).toBe(true);
  });

  it("allows staff menu access with branch-only scope", () => {
    const user = normalizeUser({
      id: "staff-branch-1",
      email: "staff-branch@example.com",
      role: "STAFF",
      actorType: "STAFF",
      restaurantAccess: { restaurantIds: [], branchIds: ["branch-1"] },
      staffRole: {
        permissions: [{ access: "menu", operations: ["read"] }],
      },
    });

    expect(hasStaffMenuAccess(user)).toBe(true);
  });

  it("rejects staff menu access without menu permission or assigned scope", () => {
    const withoutMenuPermission = normalizeUser({
      id: "staff-2",
      email: "staff-orders@example.com",
      role: "STAFF",
      actorType: "STAFF",
      restaurantAccess: { restaurantIds: ["restaurant-1"], branchIds: [] },
      staffRole: {
        permissions: [{ access: "orders", operations: ["read"] }],
      },
    });
    const withoutScope = normalizeUser({
      id: "staff-3",
      email: "staff-no-scope@example.com",
      role: "STAFF",
      actorType: "STAFF",
      staffRole: {
        permissions: [{ access: "menu", operations: ["read"] }],
      },
    });

    expect(hasStaffMenuAccess(withoutMenuPermission)).toBe(false);
    expect(hasStaffMenuAccess(withoutScope)).toBe(false);
  });

  it("allows scoped staff panel access with branch management permission", () => {
    const user = normalizeUser({
      id: "staff-branch-manager",
      email: "staff-branch-manager@example.com",
      role: "STAFF",
      actorType: "STAFF",
      restaurantId: null,
      branchId: null,
      restaurantAccess: { restaurantIds: ["restaurant-1"], branchIds: [] },
      staffRole: {
        permissions: [
          {
            access: "branch_management",
            operations: ["read", "write", "create", "update", "delete"],
          },
        ],
        restaurantAccess: { restaurantIds: ["restaurant-1"], branchIds: [] },
      },
    });

    expect(hasStaffPanelAccess(user)).toBe(true);
    expect(hasStaffPermission(user, ["branch_management"])).toBe(true);
    expect(hasStaffMenuAccess(user)).toBe(false);
    expect(getStaffDefaultRedirectPath(user)).toBe("/branches");
  });

  it("allows business-admin staff panel access with tenant scoped role", () => {
    const user = normalizeUser({
      id: "business-staff",
      email: "business-staff@example.com",
      role: "STAFF",
      actorType: "STAFF",
      panelType: "BUSINESS_ADMIN",
      tenantId: "tenant-1",
      restaurantId: null,
      branchId: null,
      restaurantAccess: { restaurantIds: [], branchIds: [] },
      staffRole: {
        panelType: "BUSINESS_ADMIN",
        tenantId: "tenant-1",
        restaurantId: null,
        branchId: null,
        restaurantAccess: null,
        permissions: [
          {
            access: "branch_management",
            operations: ["read", "write", "create", "update"],
          },
        ],
      },
    });

    expect(hasStaffPanelAccess(user)).toBe(true);
    expect(hasStaffPermission(user, ["branch_management"])).toBe(true);
    expect(getStaffDefaultRedirectPath(user)).toBe("/branches");
  });
});
