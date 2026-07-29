import { describe, expect, it } from "vitest";

import {
  getPosCustomerOptionLabel,
  resolvePosBranchSelection,
} from "./pos-selection";

describe("POS selection helpers", () => {
  const branches = [
    { id: "branch-1", name: "Secondary", isMain: false },
    { id: "branch-2", name: "Main", isMain: true },
  ];

  it("defaults to the main branch", () => {
    expect(resolvePosBranchSelection(branches)?.id).toBe("branch-2");
  });

  it("preserves an available prior branch selection", () => {
    expect(resolvePosBranchSelection(branches, "branch-1")?.id).toBe(
      "branch-1",
    );
  });

  it("identifies ambiguous and guest customers clearly", () => {
    expect(
      getPosCustomerOptionLabel(
        {
          id: "customer-123",
          email: "guest@example.com",
          isGuest: true,
          profile: { firstName: "Alex", lastName: "Smith" },
        },
        "Customer",
        "Guest",
      ),
    ).toBe("Alex Smith · Guest · guest@example.com · #customer-123");
  });
});
