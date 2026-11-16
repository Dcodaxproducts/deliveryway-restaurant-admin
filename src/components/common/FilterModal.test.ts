import { describe, expect, it } from "vitest";

import { customerTypeToIsGuest, selectionToBoolean } from "./FilterModal";

describe("customer type filtering", () => {
  it.each([
    ["all", undefined],
    ["registered", false],
    ["guest", true],
  ])("maps %s to the API isGuest filter", (customerType, expected) => {
    expect(customerTypeToIsGuest(customerType)).toBe(expected);
  });
});

describe("customer verification filtering", () => {
  it.each([["all", undefined], ["yes", true], ["no", false]])(
    "maps %s to the API boolean filter",
    (selection, expected) => {
      expect(selectionToBoolean(selection)).toBe(expected);
    },
  );
});
