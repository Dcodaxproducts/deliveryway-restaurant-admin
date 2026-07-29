import { describe, expect, it } from "vitest";

import { resolveAdminDealInitialItems } from "@/hooks/useAdminDealMenuItems";

describe("resolveAdminDealInitialItems", () => {
  it("reuses one empty collection when a category selector has no initial items", () => {
    expect(resolveAdminDealInitialItems()).toBe(
      resolveAdminDealInitialItems(),
    );
  });
});
