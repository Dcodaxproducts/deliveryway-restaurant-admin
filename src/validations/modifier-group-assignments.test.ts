import { describe, expect, it } from "vitest";

import {
  isRequiredModifierGroupAssignment,
  modifierGroupAssignmentSchema,
} from "@/validations/modifier-group-assignments";

describe("modifier group assignment validation", () => {
  it("accepts required single-select assignments", () => {
    const result = modifierGroupAssignmentSchema.safeParse({
      groupId: "group-1",
      selectionType: "SINGLE",
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
  });

  it("requires SINGLE assignments to have maxSelect of 1", () => {
    const result = modifierGroupAssignmentSchema.safeParse({
      groupId: "group-1",
      selectionType: "SINGLE",
      minSelect: 0,
      maxSelect: 2,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["maxSelect"]);
  });

  it("rejects maxSelect below minSelect", () => {
    const result = modifierGroupAssignmentSchema.safeParse({
      groupId: "group-1",
      selectionType: "MULTIPLE",
      minSelect: 3,
      maxSelect: 2,
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["maxSelect"]);
  });

  it("derives required state from minSelect", () => {
    expect(isRequiredModifierGroupAssignment({ minSelect: 1 })).toBe(true);
    expect(isRequiredModifierGroupAssignment({ minSelect: 0 })).toBe(false);
  });
});
