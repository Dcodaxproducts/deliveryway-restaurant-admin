import { describe, expect, it } from "vitest";

import { customerTypeToIsGuest } from "./FilterModal";

describe("customer type filtering", () => {
  it.each([
    ["all", undefined],
    ["registered", false],
    ["guest", true],
  ])("maps %s to the API isGuest filter", (customerType, expected) => {
    expect(customerTypeToIsGuest(customerType)).toBe(expected);
  });
});
