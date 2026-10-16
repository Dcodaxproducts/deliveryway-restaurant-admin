import { describe, expect, it } from "vitest";
import { canAccessAnalyticsCopilot } from "./analytics-copilot-access";

describe("canAccessAnalyticsCopilot", () => {
  it("allows direct business owners/admins only", () => {
    expect(canAccessAnalyticsCopilot({ role: "BUSINESS_ADMIN" })).toBe(true);
    expect(
      canAccessAnalyticsCopilot({ role: "BUSINESS_ADMIN", actorType: "STAFF" }),
    ).toBe(false);
    expect(canAccessAnalyticsCopilot({ role: "BRANCH_ADMIN" })).toBe(false);
    expect(canAccessAnalyticsCopilot({ role: "SUPER_ADMIN" })).toBe(false);
    expect(canAccessAnalyticsCopilot(null)).toBe(false);
  });
});
