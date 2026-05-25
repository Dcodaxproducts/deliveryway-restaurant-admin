import { describe, expect, it } from "vitest";

import { cleanParams, toSearchParams } from "./params";

describe("query params helpers", () => {
  it("removes undefined, null, and empty strings", () => {
    expect(cleanParams({ a: undefined, b: null, c: "", d: "ok" })).toEqual({ d: "ok" });
  });

  it("preserves 0 and false", () => {
    expect(cleanParams({ page: 0, active: false })).toEqual({ page: 0, active: false });
  });

  it("serializes arrays correctly", () => {
    expect(toSearchParams({ status: ["NEW", "DONE"], page: 1 })).toBe(
      "?status=NEW&status=DONE&page=1"
    );
  });
});
