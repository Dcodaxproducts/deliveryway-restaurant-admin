import { describe, expect, it } from "vitest";

import {
  isInvalidWinOrderStoreId,
  parseWinOrderStoreId,
} from "@/lib/winorder-store-id";

describe("parseWinOrderStoreId", () => {
  it("accepts non-negative integer Store IDs", () => {
    expect(parseWinOrderStoreId("0")).toBe(0);
    expect(parseWinOrderStoreId(" 41 ")).toBe(41);
  });

  it.each(["", "-1", "1.5", "store-1"])(
    "rejects invalid Store ID %s",
    (value) => {
      expect(parseWinOrderStoreId(value)).toBeNull();
    },
  );

  it("allows an empty optional Store ID but rejects invalid values", () => {
    expect(isInvalidWinOrderStoreId("")).toBe(false);
    expect(isInvalidWinOrderStoreId("  ")).toBe(false);
    expect(isInvalidWinOrderStoreId("41")).toBe(false);
    expect(isInvalidWinOrderStoreId("store-1")).toBe(true);
  });
});
