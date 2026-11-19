import { describe, expect, it } from "vitest";

import { resolveOrderDealDisplayName } from "@/lib/order-deal-name";

describe("resolveOrderDealDisplayName", () => {
  it("prefers resolved deal and package names over generic names", () => {
    expect(
      resolveOrderDealDisplayName({
        dealId: "deal-1",
        dealName: "Family Feast",
        name: "Deal",
      }),
    ).toBe("Family Feast");
    expect(
      resolveOrderDealDisplayName({
        packageId: "package-1",
        packageName: "Lunch Package",
      }),
    ).toBe("Lunch Package");
  });

  it("keeps a readable identifier fallback for legacy payloads", () => {
    expect(resolveOrderDealDisplayName({ dealId: "legacy-deal" })).toBe(
      "Deal legacy-deal",
    );
    expect(
      resolveOrderDealDisplayName({ packageId: "legacy-package" }, "Package"),
    ).toBe("Package legacy-package");
  });
});
