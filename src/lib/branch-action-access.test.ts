import { describe, expect, it } from "vitest";
import {
  canActivateBranch,
  canDeleteOrSuspendBranch,
} from "./branch-action-access";

describe("branch action access", () => {
  it("hides destructive branch actions from business admins", () => {
    expect(canDeleteOrSuspendBranch("BUSINESS_ADMIN")).toBe(false);
    expect(canDeleteOrSuspendBranch("RESTAURANT_ADMIN")).toBe(false);
  });

  it("preserves destructive actions for super admins", () => {
    expect(canDeleteOrSuspendBranch("SUPER_ADMIN")).toBe(true);
  });

  it("keeps activation available to API-authorized admin roles", () => {
    expect(canActivateBranch("BUSINESS_ADMIN")).toBe(true);
    expect(canActivateBranch("SUPER_ADMIN")).toBe(true);
    expect(canActivateBranch("BRANCH_ADMIN")).toBe(false);
  });
});
