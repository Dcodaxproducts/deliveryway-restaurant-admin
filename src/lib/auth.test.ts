import { describe, expect, it } from "vitest";

import { isBranchAdminRole, normalizeUser } from "@/lib/auth";

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
});
