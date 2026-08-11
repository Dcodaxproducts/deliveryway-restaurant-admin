import { describe, expect, it } from "vitest";

import {
  readBranchPaymentOptions,
  resolveSelectedBranchMethods,
} from "./restaurant-branch-payment-methods";

describe("restaurant branch payment method helpers", () => {
  it("reads branch payment settings from the branch list response", () => {
    expect(
      readBranchPaymentOptions({
        data: [
          {
            id: "branch-1",
            name: "City Centre",
            isActive: false,
            settings: {
              allowedPaymentMethods: ["STRIPE", "COD", "UNKNOWN"],
            },
          },
        ],
      }),
    ).toEqual([
      {
        id: "branch-1",
        name: "City Centre",
        isActive: false,
        allowedPaymentMethods: ["STRIPE", "COD"],
      },
    ]);
  });

  it("keeps the branch selection inside the Super Admin assignment", () => {
    const [branch] = readBranchPaymentOptions({
      data: [
        {
          id: "branch-1",
          name: "City Centre",
          settings: { allowedPaymentMethods: ["STRIPE", "PAYPAL"] },
        },
      ],
    });

    expect(resolveSelectedBranchMethods(branch, ["COD", "STRIPE"])).toEqual([
      "STRIPE",
    ]);
  });

  it("uses the backend-compatible defaults for an unconfigured branch", () => {
    const [branch] = readBranchPaymentOptions({
      data: [{ id: "branch-1", name: "City Centre", settings: {} }],
    });

    expect(
      resolveSelectedBranchMethods(branch, ["COD", "STRIPE", "PAYPAL"]),
    ).toEqual(["COD", "PAYPAL"]);
  });
});
