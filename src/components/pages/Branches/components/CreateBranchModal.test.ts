import { describe, expect, it, vi } from "vitest";

import {
  assignMenusBeforeOptionalSuspend,
  extractCreatedBranch,
  extractRestaurantMenus,
} from "./branch-workflow-utils";

describe("branch creation workflow response parsing", () => {
  it("supports branch-only and branch-admin creation response envelopes", () => {
    expect(
      extractCreatedBranch({ data: { id: "branch-1", name: "Central" } }),
    ).toEqual({ id: "branch-1", name: "Central" });
    expect(
      extractCreatedBranch({
        data: { branch: { id: "branch-2", name: "North" } },
      }),
    ).toEqual({ id: "branch-2", name: "North" });
  });

  it("normalizes restaurant menu list envelopes for assignment", () => {
    expect(
      extractRestaurantMenus({
        data: { items: [{ id: "menu-1", name: "Dinner", isDefault: true }] },
      }),
    ).toEqual([{ id: "menu-1", name: "Dinner", isDefault: true }]);
    expect(
      extractRestaurantMenus({
        data: [{ id: "menu-2", name: "Lunch", isDefault: false }],
      }),
    ).toEqual([{ id: "menu-2", name: "Lunch", isDefault: false }]);
    expect(extractRestaurantMenus({ data: { menus: [] } })).toEqual([]);
  });
});

describe("branch setup finalization sequencing", () => {
  it("assigns menus before applying the requested inactive status", async () => {
    const calls: string[] = [];
    await assignMenusBeforeOptionalSuspend({
      assignMenus: async () => {
        calls.push("assign");
      },
      suspendBranch: async () => {
        calls.push("suspend");
      },
      shouldSuspend: true,
      onAssignmentSaved: () => calls.push("assigned"),
    });
    expect(calls).toEqual(["assign", "assigned", "suspend"]);
  });

  it("does not suspend when assignment fails", async () => {
    const suspendBranch = vi.fn();
    await expect(
      assignMenusBeforeOptionalSuspend({
        assignMenus: async () => {
          throw new Error("assign failed");
        },
        suspendBranch,
        shouldSuspend: true,
        onAssignmentSaved: vi.fn(),
      }),
    ).rejects.toMatchObject({
      stage: "assignment",
    });
    expect(suspendBranch).not.toHaveBeenCalled();
  });

  it("reports status-stage failure after assignment is saved", async () => {
    const onAssignmentSaved = vi.fn();
    await expect(
      assignMenusBeforeOptionalSuspend({
        assignMenus: async () => undefined,
        suspendBranch: async () => {
          throw new Error("suspend failed");
        },
        shouldSuspend: true,
        onAssignmentSaved,
      }),
    ).rejects.toMatchObject({
      stage: "status",
    });
    expect(onAssignmentSaved).toHaveBeenCalledOnce();
  });
});
