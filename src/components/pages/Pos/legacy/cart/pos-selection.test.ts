import { describe, expect, it } from "vitest";

import {
  filterRegisteredPosCustomers,
  getPosCustomerDisplayId,
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

  it("uses only the customer name for the compact selector label", () => {
    expect(
      getPosCustomerOptionLabel(
        {
          id: "customer-123",
          email: "alex@example.com",
          profile: { firstName: "Alex", lastName: "Smith" },
        },
        "Customer",
      ),
    ).toBe("Alex Smith");
  });

  it("excludes guest customer records from POS selection", () => {
    expect(
      filterRegisteredPosCustomers([
        { id: "registered", email: "member@example.com", isGuest: false },
        { id: "guest", email: "guest@example.com", isGuest: true },
      ]).map((customer) => customer.id),
    ).toEqual(["registered"]);
  });

  it("builds a stable compact customer ID from the searchable user ID", () => {
    expect(getPosCustomerDisplayId("cm1234567890abcdef")).toBe("90ABCDEF");
    expect(getPosCustomerDisplayId("customer-1")).toBe("STOMER-1");
  });
});
