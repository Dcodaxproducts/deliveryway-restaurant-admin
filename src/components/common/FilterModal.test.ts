import fs from "node:fs";
import path from "node:path";
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

describe("filter accessibility", () => {
  it("exposes keyboard-operable radio controls and a labelled deleted option", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/common/FilterModal.tsx"),
      "utf8",
    );
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('role="radio"');
    expect(source).toContain("aria-checked");
    expect(source).not.toContain('<div onClick={() => setStatus');
    expect(source).toContain('<label className="flex items-center gap-2">');
  });
});
