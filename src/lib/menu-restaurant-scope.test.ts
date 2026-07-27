import { describe, expect, it } from "vitest";

import { resolveMenuRestaurantId } from "./menu-restaurant-scope";

describe("resolveMenuRestaurantId", () => {
  it("uses the active restaurant selected by an all-restaurants staff member", () => {
    expect(
      resolveMenuRestaurantId(
        "selected-restaurant",
        "default-restaurant",
        "form-restaurant",
      ),
    ).toBe("selected-restaurant");
  });

  it("uses the staff member's assigned restaurant when no picker is required", () => {
    expect(resolveMenuRestaurantId(undefined, "assigned-restaurant")).toBe(
      "assigned-restaurant",
    );
  });

  it("never substitutes an unrelated tenant identifier", () => {
    expect(
      resolveMenuRestaurantId(undefined, undefined, "form-restaurant"),
    ).toBe("form-restaurant");
  });
});
