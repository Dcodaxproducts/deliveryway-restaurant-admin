import { describe, expect, it } from "vitest";

import { createBranchSchema } from "@/validations/branches";

const createBranchPayload = {
  name: "Blue Area",
  isMain: false,
  branchAdmin: {},
};

describe("branch service charge validation", () => {
  it("accepts percentage service charge", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 10,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts amount service charge", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 100,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects enabled percentage service charge above 100", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 101,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects enabled percentage service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "PERCENTAGE",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects enabled amount service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: true,
          type: "AMOUNT",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts disabled service charge with zero value", () => {
    const result = createBranchSchema.safeParse({
      ...createBranchPayload,
      settings: {
        serviceCharge: {
          isEnabled: false,
          type: "PERCENTAGE",
          value: 0,
        },
      },
    });

    expect(result.success).toBe(true);
  });
});
