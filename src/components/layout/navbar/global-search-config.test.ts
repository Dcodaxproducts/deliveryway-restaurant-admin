import { describe, expect, it } from "vitest";

import {
  buildSearchHref,
  buildUnifiedSearchHref,
  GLOBAL_SEARCH_MODULES,
} from "@/components/layout/navbar/global-search-config";

describe("global search config", () => {
  it("contains every global search module", () => {
    expect(GLOBAL_SEARCH_MODULES.map((module) => module.entity)).toEqual([
      "orders",
      "menuItems",
      "customers",
      "branches",
      "deliverymen",
      "employees",
      "promotions",
      "deals",
      "tableReservations",
      "restaurants",
      "faqs",
    ]);
  });

  it("builds encoded hrefs", () => {
    expect(buildSearchHref("/orders", "lunch deal")).toBe("/orders?search=lunch+deal");
    expect(buildUnifiedSearchHref("lunch deal")).toBe("/search?query=lunch+deal");
  });
});
