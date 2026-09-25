import { describe, expect, it } from "vitest";

import {
  extractCreatedBranch,
  extractRestaurantMenus,
} from "./branch-workflow-utils";

describe("branch creation workflow response parsing", () => {
  it("supports branch-only and branch-admin creation response envelopes", () => {
    expect(
      extractCreatedBranch({ data: { id: "branch-1", name: "Central" } }),
    ).toEqual({ id: "branch-1", name: "Central" });
    expect(
      extractCreatedBranch({
        data: { branch: { id: "branch-2", name: "North" } },
      }),
    ).toEqual({ id: "branch-2", name: "North" });
  });

  it("normalizes restaurant menu list envelopes for assignment", () => {
    expect(
      extractRestaurantMenus({
        data: { items: [{ id: "menu-1", name: "Dinner", isDefault: true }] },
      }),
    ).toEqual([{ id: "menu-1", name: "Dinner", isDefault: true }]);
    expect(extractRestaurantMenus({ data: { menus: [] } })).toEqual([]);
  });
});
